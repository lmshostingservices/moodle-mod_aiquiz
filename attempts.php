<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * View attempts page for mod_aiquiz.
 *
 * @package    mod_aiquiz
 * @copyright  2025 Essay Grader AI
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
$attemptid = optional_param('attemptid', 0, PARAM_INT);
$download = optional_param('download', '', PARAM_ALPHA);
$search = optional_param('search', '', PARAM_RAW); // pipeline-ignore: PARAM_RAW — free-form rich text/HTML, escaped or format_text()d on output
$filterstate = optional_param('filterstate', '', PARAM_ALPHA);
$filtergroup = optional_param('filtergroup', 0, PARAM_INT);
$sortby = optional_param('sortby', 'timecreated', PARAM_ALPHA);
$sortorder = optional_param('sortorder', 'desc', PARAM_ALPHA);
$page = optional_param('page', 0, PARAM_INT);
$perpage = optional_param('perpage', 25, PARAM_INT);

$cm = get_coursemodule_from_id('aiquiz', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
$aiquiz = $DB->get_record('aiquiz', ['id' => $cm->instance], '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/aiquiz:viewreports', $context);

$PAGE->set_url('/mod/aiquiz/attempts.php', ['id' => $cm->id]);
$PAGE->set_title(format_string($aiquiz->name) . ' - ' . get_string('viewattempts', 'mod_aiquiz'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

$PAGE->requires->css('/mod/aiquiz/styles/tokens.css');
$PAGE->requires->css('/mod/aiquiz/styles/bridge.css');

if ($action === 'delete' && $attemptid && has_capability('mod/aiquiz:deleteattempts', $context)) {
    require_sesskey();

    $attempt = $DB->get_record('aiquiz_attempts', ['id' => $attemptid, 'aiquizid' => $aiquiz->id]);
    if ($attempt) {
        $DB->delete_records('aiquiz_responses', ['attemptid' => $attemptid]);
        $DB->delete_records('aiquiz_attempts', ['id' => $attemptid]);
        aiquiz_update_grades($aiquiz, $attempt->userid);
    }

    redirect(new moodle_url('/mod/aiquiz/attempts.php', ['id' => $cm->id]),
        get_string('attemptdeleted', 'mod_aiquiz'), null, \core\output\notification::NOTIFY_SUCCESS);
}

$validcols = ['firstname', 'lastname', 'email', 'state', 'grade', 'timecreated', 'timefinished'];
if (!in_array($sortby, $validcols)) {
    $sortby = 'timecreated';
}
$sortorder = strtoupper($sortorder) === 'ASC' ? 'ASC' : 'DESC';

$params = ['aiquizid' => $aiquiz->id];
$where = 'a.aiquizid = :aiquizid';

if (!empty($search)) {
    $search = trim($search);
    $where .= " AND (u.firstname LIKE :search1 OR u.lastname LIKE :search2 OR u.email LIKE :search3 OR " .
              $DB->sql_concat('u.firstname', "' '", 'u.lastname') . " LIKE :search4)";
    $params['search1'] = '%' . $search . '%';
    $params['search2'] = '%' . $search . '%';
    $params['search3'] = '%' . $search . '%';
    $params['search4'] = '%' . $search . '%';
}

if (!empty($filterstate)) {
    $where .= " AND a.state = :state";
    $params['state'] = $filterstate;
}

if ($filtergroup > 0) {
    $where .= " AND EXISTS (SELECT 1 FROM {groups_members} gm WHERE gm.userid = u.id AND gm.groupid = :groupid)";
    $params['groupid'] = $filtergroup;
}

$countsql = "SELECT COUNT(a.id)
             FROM {aiquiz_attempts} a
             JOIN {user} u ON u.id = a.userid
             WHERE $where";
$totalcount = $DB->count_records_sql($countsql, $params);

$sql = "SELECT a.*, u.id AS uid, u.firstname, u.lastname, u.email, u.picture, u.imagealt
        FROM {aiquiz_attempts} a
        JOIN {user} u ON u.id = a.userid
        WHERE $where
        ORDER BY {$sortby} {$sortorder}";
$attempts = $DB->get_records_sql($sql, $params, $page * $perpage, $perpage);

$allattemptsql = "SELECT a.*, u.firstname, u.lastname, u.email
                  FROM {aiquiz_attempts} a
                  JOIN {user} u ON u.id = a.userid
                  WHERE a.aiquizid = ?
                  ORDER BY a.timecreated DESC";
$allattempts = $DB->get_records_sql($allattemptsql, [$aiquiz->id]);

if ($download === 'csv' || $download === 'excel') {
    $exportdata = [];
    $exportdata[] = [
        get_string('student', 'mod_aiquiz'),
        get_string('email', 'mod_aiquiz'),
        get_string('status', 'mod_aiquiz'),
        get_string('grade', 'mod_aiquiz'),
        get_string('started', 'mod_aiquiz'),
        get_string('completed', 'mod_aiquiz'),
        get_string('duration', 'mod_aiquiz'),
    ];

    foreach ($allattempts as $attempt) {
        $duration = '';
        if ($attempt->timefinished && $attempt->timecreated) {
            $secs = $attempt->timefinished - $attempt->timecreated;
            $duration = gmdate('H:i:s', $secs);
        }

        $exportdata[] = [
            $attempt->firstname . ' ' . $attempt->lastname,
            $attempt->email,
            $attempt->state,
            $attempt->state === 'finished' ? round($attempt->grade, 1) . '%' : '',
            userdate($attempt->timecreated, '%Y-%m-%d %H:%M'),
            $attempt->timefinished ? userdate($attempt->timefinished, '%Y-%m-%d %H:%M') : '',
            $duration,
        ];
    }

    if ($download === 'csv') {
        $filename = clean_filename($aiquiz->name . '_attempts_' . date('Y-m-d')) . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $output = fopen('php://output', 'w');
        foreach ($exportdata as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
        exit;
    }
}

echo $OUTPUT->header();

echo '<div class="aiquiz-container">';

echo '<div class="aiquiz-header">';
echo '<h2 class="aiquiz-title">' . get_string('viewattempts', 'mod_aiquiz') . '</h2>';
echo '<div class="aiquiz-header-actions">';
echo '<a href="' . new moodle_url('/mod/aiquiz/view.php', ['id' => $cm->id]) . '" class="btn btn-secondary">';
echo '<i class="fa fa-arrow-left"></i> ' . get_string('back') . '</a>';
echo '</div>';
echo '</div>';

$finishedcount = 0;
$passedcount = 0;
$totalgrade = 0;
foreach ($allattempts as $attempt) {
    if ($attempt->state === 'finished') {
        $finishedcount++;
        $totalgrade += $attempt->grade;
        if ($attempt->grade >= $aiquiz->passinggrade) {
            $passedcount++;
        }
    }
}
$avggrade = $finishedcount > 0 ? $totalgrade / $finishedcount : 0;
$passrate = $finishedcount > 0 ? ($passedcount / $finishedcount) * 100 : 0;

echo '<div class="aiquiz-info-cards">';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-users"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('attempts', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-card-value">' . count($allattempts) . '</div>';
echo '</div></div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-check-circle"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('completed', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-card-value">' . $finishedcount . '</div>';
echo '</div></div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-trophy"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('passed', 'mod_aiquiz') . '</div>';
echo '<div class="aiquiz-card-value">' . $passedcount . ' (' . round($passrate) . '%)</div>';
echo '</div></div>';

echo '<div class="aiquiz-card">';
echo '<div class="aiquiz-card-icon"><i class="fa fa-bar-chart"></i></div>';
echo '<div class="aiquiz-card-content">';
echo '<div class="aiquiz-card-label">' . get_string('grade', 'mod_aiquiz') . ' (avg)</div>';
echo '<div class="aiquiz-card-value">' . round($avggrade, 1) . '%</div>';
echo '</div></div>';

echo '</div>';

echo '<div class="aiquiz-filter-section">';
echo '<form method="get" action="" class="aiquiz-filter-form">';
echo '<input type="hidden" name="id" value="' . $cm->id . '">';

echo '<div class="aiquiz-filter-row">';

echo '<div class="aiquiz-search-box">';
echo '<i class="fa fa-search"></i>';
echo '<input type="text" name="search" value="' . s($search) . '" placeholder="' . 
     get_string('searchstudent', 'mod_aiquiz') . '" class="form-control">';
echo '</div>';

echo '<select name="filterstate" class="form-control aiquiz-filter-select">';
echo '<option value="">' . get_string('allstates', 'mod_aiquiz') . '</option>';
echo '<option value="inprogress"' . ($filterstate === 'inprogress' ? ' selected' : '') . '>' . 
     get_string('inprogress', 'mod_aiquiz') . '</option>';
echo '<option value="finished"' . ($filterstate === 'finished' ? ' selected' : '') . '>' . 
     get_string('finished', 'mod_aiquiz') . '</option>';
echo '</select>';

$groups = groups_get_all_groups($course->id, 0, $cm->groupingid);
if (!empty($groups)) {
    echo '<select name="filtergroup" class="form-control aiquiz-filter-select">';
    echo '<option value="0">' . get_string('allgroups', 'mod_aiquiz') . '</option>';
    foreach ($groups as $group) {
        echo '<option value="' . $group->id . '"' . ($filtergroup == $group->id ? ' selected' : '') . '>' . 
             format_string($group->name) . '</option>';
    }
    echo '</select>';
}

echo '<button type="submit" class="btn btn-primary">';
echo '<i class="fa fa-filter"></i> ' . get_string('filter', 'mod_aiquiz') . '</button>';

echo '</div>';

echo '<div class="aiquiz-filter-row aiquiz-filter-secondary">';
echo '<div class="aiquiz-sort-options">';
echo '<label>' . get_string('sortby', 'mod_aiquiz') . ':</label>';
echo '<select name="sortby" class="form-control form-control-sm">';
echo '<option value="timecreated"' . ($sortby === 'timecreated' ? ' selected' : '') . '>' . 
     get_string('started', 'mod_aiquiz') . '</option>';
echo '<option value="firstname"' . ($sortby === 'firstname' ? ' selected' : '') . '>' . 
     get_string('firstname') . '</option>';
echo '<option value="lastname"' . ($sortby === 'lastname' ? ' selected' : '') . '>' . 
     get_string('lastname') . '</option>';
echo '<option value="grade"' . ($sortby === 'grade' ? ' selected' : '') . '>' . 
     get_string('grade', 'mod_aiquiz') . '</option>';
echo '<option value="state"' . ($sortby === 'state' ? ' selected' : '') . '>' . 
     get_string('status', 'mod_aiquiz') . '</option>';
echo '</select>';
echo '<select name="sortorder" class="form-control form-control-sm">';
echo '<option value="desc"' . ($sortorder === 'DESC' ? ' selected' : '') . '>' . 
     get_string('descending', 'mod_aiquiz') . '</option>';
echo '<option value="asc"' . ($sortorder === 'ASC' ? ' selected' : '') . '>' . 
     get_string('ascending', 'mod_aiquiz') . '</option>';
echo '</select>';
echo '</div>';

echo '<div class="aiquiz-export-options">';
echo '<a href="' . new moodle_url('/mod/aiquiz/attempts.php', ['id' => $cm->id, 'download' => 'csv']) . 
     '" class="btn btn-sm btn-secondary">';
echo '<i class="fa fa-download"></i> ' . get_string('exportcsv', 'mod_aiquiz') . '</a>';
echo '</div>';
echo '</div>';

echo '</form>';
echo '</div>';

if ($totalcount > 0) {
    echo '<div class="aiquiz-results-info">';
    echo '<span>' . get_string('showingresults', 'mod_aiquiz', (object)[
        'showing' => count($attempts),
        'total' => $totalcount
    ]) . '</span>';
    echo '</div>';
}

if (empty($attempts)) {
    echo '<div class="aiquiz-empty-state">';
    echo '<div class="aiquiz-empty-state-icon"><i class="fa fa-clipboard-list"></i></div>';
    echo '<div class="aiquiz-empty-state-title">' . get_string('noattempts', 'mod_aiquiz') . '</div>';
    if (!empty($search) || !empty($filterstate) || $filtergroup > 0) {
        echo '<div class="aiquiz-empty-state-text">Try adjusting your search or filters.</div>';
    }
    echo '</div>';
} else {
    echo '<div class="aiquiz-attempts-section">';
    echo '<table class="aiquiz-attempts-table" id="attempts-table">';
    echo '<thead><tr>';
    
    echo '<th class="sortable" data-sort="firstname">';
    echo get_string('student', 'mod_aiquiz');
    if ($sortby === 'firstname' || $sortby === 'lastname') {
        echo ' <i class="fa fa-sort-' . ($sortorder === 'ASC' ? 'up' : 'down') . '"></i>';
    }
    echo '</th>';
    
    echo '<th>' . get_string('email', 'mod_aiquiz') . '</th>';
    
    echo '<th class="sortable" data-sort="state">';
    echo get_string('status', 'mod_aiquiz');
    if ($sortby === 'state') {
        echo ' <i class="fa fa-sort-' . ($sortorder === 'ASC' ? 'up' : 'down') . '"></i>';
    }
    echo '</th>';
    
    echo '<th class="sortable" data-sort="grade">';
    echo get_string('grade', 'mod_aiquiz');
    if ($sortby === 'grade') {
        echo ' <i class="fa fa-sort-' . ($sortorder === 'ASC' ? 'up' : 'down') . '"></i>';
    }
    echo '</th>';
    
    echo '<th class="sortable" data-sort="timecreated">';
    echo get_string('started', 'mod_aiquiz');
    if ($sortby === 'timecreated') {
        echo ' <i class="fa fa-sort-' . ($sortorder === 'ASC' ? 'up' : 'down') . '"></i>';
    }
    echo '</th>';
    
    echo '<th>' . get_string('duration', 'mod_aiquiz') . '</th>';
    echo '<th>' . get_string('actions', 'mod_aiquiz') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';

    foreach ($attempts as $attempt) {
        echo '<tr>';
        
        echo '<td class="student-cell">';
        echo '<div class="student-info">';
        echo $OUTPUT->user_picture((object)[
            'id' => $attempt->uid,
            'picture' => $attempt->picture,
            'firstname' => $attempt->firstname,
            'lastname' => $attempt->lastname,
            'imagealt' => $attempt->imagealt,
        ], ['size' => 32, 'class' => 'student-avatar']);
        echo '<span class="student-name">' . fullname($attempt) . '</span>';
        echo '</div>';
        echo '</td>';
        
        echo '<td class="email-cell">' . $attempt->email . '</td>';

        if ($attempt->state === 'inprogress') {
            echo '<td><span class="aiquiz-state-inprogress"><i class="fa fa-spinner fa-pulse"></i> ' . 
                 get_string('inprogress', 'mod_aiquiz') . '</span></td>';
            echo '<td class="grade-cell">-</td>';
        } else {
            $passed = $attempt->grade >= $aiquiz->passinggrade;
            $stateclass = $passed ? 'aiquiz-state-passed' : 'aiquiz-state-failed';
            $icon = $passed ? 'fa-check' : 'fa-times';
            echo '<td><span class="' . $stateclass . '"><i class="fa ' . $icon . '"></i> ' . 
                 ($passed ? get_string('passed', 'mod_aiquiz') : get_string('notpassed', 'mod_aiquiz')) . '</span></td>';
            echo '<td class="grade-cell"><span class="grade-value">' . round($attempt->grade, 1) . '%</span></td>';
        }

        echo '<td class="date-cell">' . userdate($attempt->timecreated, '%d %b %Y, %H:%M') . '</td>';
        
        $duration = '-';
        if ($attempt->timefinished && $attempt->timecreated) {
            $secs = $attempt->timefinished - $attempt->timecreated;
            if ($secs >= 3600) {
                $duration = gmdate('H:i:s', $secs);
            } else {
                $duration = gmdate('i:s', $secs);
            }
        }
        echo '<td class="duration-cell">' . $duration . '</td>';

        echo '<td class="actions-cell">';
        if ($attempt->state === 'finished') {
            echo '<a href="' . new moodle_url('/mod/aiquiz/review.php', [
                'id' => $cm->id,
                'attempt' => $attempt->id,
            ]) . '" class="btn btn-sm btn-secondary" title="Review"><i class="fa fa-eye"></i></a> ';
        }

        if (has_capability('mod/aiquiz:deleteattempts', $context)) {
            echo '<a href="' . new moodle_url('/mod/aiquiz/attempts.php', [
                'id' => $cm->id,
                'action' => 'delete',
                'attemptid' => $attempt->id,
                'sesskey' => sesskey(),
            ]) . '" onclick="return confirm(\'Delete this attempt?\');" class="btn btn-sm btn-danger" title="Delete">';
            echo '<i class="fa fa-trash"></i></a>';
        }
        echo '</td>';

        echo '</tr>';
    }

    echo '</tbody>';
    echo '</table>';
    echo '</div>';

    if ($totalcount > $perpage) {
        $baseurl = new moodle_url('/mod/aiquiz/attempts.php', [
            'id' => $cm->id,
            'search' => $search,
            'filterstate' => $filterstate,
            'filtergroup' => $filtergroup,
            'sortby' => $sortby,
            'sortorder' => strtolower($sortorder),
        ]);
        echo $OUTPUT->paging_bar($totalcount, $page, $perpage, $baseurl);
    }
}

echo '</div>';

echo '<style>
.aiquiz-header-actions { display: flex; gap: 10px; margin-top: 10px; }
.aiquiz-filter-section { 
    background: rgba(255,255,255,0.9); 
    backdrop-filter: blur(20px);
    border-radius: 16px; 
    padding: 24px; 
    margin-bottom: 24px;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.aiquiz-filter-form { display: flex; flex-direction: column; gap: 16px; }
.aiquiz-filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.aiquiz-filter-secondary { justify-content: space-between; }
.aiquiz-search-box { 
    position: relative; 
    flex: 1; 
    min-width: 250px; 
    max-width: 400px; 
}
.aiquiz-search-box i { 
    position: absolute; 
    left: 14px; 
    top: 50%; 
    transform: translateY(-50%); 
    color: #94a3b8; 
}
.aiquiz-search-box input { 
    padding-left: 40px; 
    border-radius: 10px; 
    border: 2px solid #e2e8f0;
    font-size: 14px;
}
.aiquiz-search-box input:focus { border-color: #3b82f6; }
.aiquiz-filter-select { 
    min-width: 160px; 
    border-radius: 10px; 
    border: 2px solid #e2e8f0;
}
.aiquiz-sort-options { display: flex; align-items: center; gap: 8px; }
.aiquiz-sort-options label { font-weight: 600; color: #64748b; margin: 0; font-size: 13px; }
.aiquiz-sort-options select { width: auto; }
.aiquiz-results-info { 
    font-size: 13px; 
    color: #64748b; 
    margin-bottom: 12px; 
    font-weight: 500; 
}
.student-cell .student-info { display: flex; align-items: center; gap: 12px; }
.student-cell .student-avatar { border-radius: 50%; }
.student-cell .student-name { font-weight: 600; color: #0f172a; }
.email-cell { color: #64748b; font-size: 13px; }
.grade-cell .grade-value { 
    font-family: "JetBrains Mono", monospace; 
    font-weight: 700; 
    color: #0f172a;
}
.date-cell { font-size: 13px; color: #64748b; }
.duration-cell { 
    font-family: "JetBrains Mono", monospace; 
    font-size: 13px; 
    color: #64748b;
}
.actions-cell { display: flex; gap: 6px; }
.actions-cell .btn { padding: 6px 10px; }
.btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.btn-danger:hover { background: #fecaca; }
th.sortable { cursor: pointer; user-select: none; }
th.sortable:hover { color: #3b82f6; }
.aiquiz-empty-state { padding: 48px; }
@media (max-width: 768px) {
    .aiquiz-filter-row { flex-direction: column; }
    .aiquiz-search-box { max-width: 100%; }
    .aiquiz-sort-options { flex-wrap: wrap; }
    .student-cell .student-info { flex-direction: column; align-items: flex-start; gap: 4px; }
    .email-cell { word-break: break-all; }
}
</style>';

echo '<script>
document.querySelectorAll("th.sortable").forEach(function (th) {
    th.addEventListener("click", function () {
        var sortby = this.dataset.sort;
        var currentSortby = "' . $sortby . '";
        var currentOrder = "' . strtolower($sortorder) . '";
        var newOrder = sortby === currentSortby && currentOrder === "desc" ? "asc" : "desc";
        var url = new URL(window.location.href);
        url.searchParams.set("sortby", sortby);
        url.searchParams.set("sortorder", newOrder);
        window.location.href = url.toString();
    });
});
</script>';

echo $OUTPUT->footer();
