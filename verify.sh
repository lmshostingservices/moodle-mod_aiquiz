#!/bin/bash
# AI Quiz Plugin Verification Script
# Run before building ZIP to catch common errors

cd "$(dirname "$0")"

ERRORS=0

echo "═══════════════════════════════════════════════════════════════"
echo "  AI Quiz Plugin Verification Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Check all source files have matching build files
echo "▶ Checking AMD source/build file sync..."
find amd/src -name "*.js" 2>/dev/null | while read src; do
    rel="${src#amd/src/}"
    build="amd/build/${rel%.js}.min.js"
    if [ ! -f "$build" ]; then
        echo "  ✗ MISSING BUILD: $build"
        echo "ERROR" >> /tmp/verify_errors
    fi
done
echo "  ✓ Source/build file check complete"
echo ""

# 2. Check for undefined API method calls (especially Api.call which doesn't exist)
echo "▶ Checking API method calls..."
if grep -r "Api\.call" amd/build/ >/dev/null 2>&1; then
    echo "  ✗ UNDEFINED: Api.call found (should be Api.request)"
    grep -rn "Api\.call" amd/build/
    echo "ERROR" >> /tmp/verify_errors
fi
echo "  ✓ API method check complete"
echo ""

# 3. Check for undefined CSS variables
echo "▶ Checking CSS variable definitions..."
# Check for old --aiquiz- variables (should not exist)
for cssfile in styles/authoring.css styles/bridge.css styles/premium.css; do
    if [ -f "$cssfile" ]; then
        OLD_COUNT=$(grep -c 'var(--aiquiz-' "$cssfile" 2>/dev/null | head -1 || echo "0")
        if [ "$OLD_COUNT" != "" ] && [ "$OLD_COUNT" -gt 0 ] 2>/dev/null; then
            echo "  ✗ DEPRECATED: $OLD_COUNT uses of --aiquiz-* in $cssfile"
            echo "ERROR" >> /tmp/verify_errors
        fi
    fi
done
echo "  ✓ CSS variable check complete"
echo ""

# 4. Check required PHP files exist
echo "▶ Checking required PHP files..."
for file in version.php lib.php mod_form.php view.php index.php db/access.php db/install.xml lang/en/aiquiz.php; do
    if [ ! -f "$file" ]; then
        echo "  ✗ MISSING: $file"
        echo "ERROR" >> /tmp/verify_errors
    fi
done
echo "  ✓ PHP file check complete"
echo ""

# 5. Version check
echo "▶ Checking version..."
VERSION=$(grep -oE "release\s*=\s*'[^']+'" version.php | grep -oE "'[^']+'" | tr -d "'")
echo "  Plugin version: $VERSION"
echo ""

# 6. Check source/build content sync (key files)
echo "▶ Checking critical file sync..."
for name in wizard api state; do
    src=$(find amd/src -name "$name.js" 2>/dev/null | head -1)
    build=$(find amd/build -name "$name.min.js" 2>/dev/null | head -1)
    if [ -f "$src" ] && [ -f "$build" ]; then
        if ! diff -q "$src" "$build" >/dev/null 2>&1; then
            echo "  ⚠ OUT OF SYNC: $src vs $build"
        fi
    fi
done
echo "  ✓ File sync check complete"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
if [ -f /tmp/verify_errors ]; then
    ERRORS=$(wc -l < /tmp/verify_errors)
    rm -f /tmp/verify_errors
    echo "  ✗ FAILED: $ERRORS error(s) found"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
else
    echo "  ✓ PASSED: All checks passed"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
fi
