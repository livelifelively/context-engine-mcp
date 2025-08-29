#!/bin/bash

# Pre-publish validation script for ContextEngine MCP
# This script ensures all checks pass before publishing to npm

set -e  # Exit on any error

echo "🔍 Running pre-publish checks for context-engine..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Check if we're on master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    print_status "FAIL" "Must be on master branch to publish (currently on $CURRENT_BRANCH)"
    exit 1
fi
print_status "PASS" "On master branch"

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_status "FAIL" "Working directory not clean. Commit or stash changes."
    git status --short
    exit 1
fi
print_status "PASS" "Working directory is clean"

# Check if we're logged into npm
if ! npm whoami > /dev/null 2>&1; then
    print_status "FAIL" "Not logged into npm. Run 'npm login' first."
    exit 1
fi
print_status "PASS" "Logged into npm as $(npm whoami)"

# Check package name
PACKAGE_NAME=$(node -p "require('./package.json').name")
if [ "$PACKAGE_NAME" != "context-engine" ]; then
    print_status "FAIL" "Package name should be 'context-engine', found: $PACKAGE_NAME"
    exit 1
fi
print_status "PASS" "Package name is correct: $PACKAGE_NAME"

# Check if package name is available
if npm view "$PACKAGE_NAME" > /dev/null 2>&1; then
    print_status "WARN" "Package $PACKAGE_NAME already exists on npm"
else
    print_status "PASS" "Package name $PACKAGE_NAME is available"
fi

echo ""
echo "🧪 Running tests..."
if npm run test:run > /dev/null 2>&1; then
    print_status "PASS" "All tests passed"
else
    print_status "FAIL" "Tests failed"
    npm run test:run
    exit 1
fi

echo ""
echo "🔨 Building project..."
if npm run build > /dev/null 2>&1; then
    print_status "PASS" "Build successful"
else
    print_status "FAIL" "Build failed"
    npm run build
    exit 1
fi

echo ""
echo "🔍 Running linting..."
if npm run lint > /dev/null 2>&1; then
    print_status "PASS" "Linting passed"
else
    print_status "FAIL" "Linting failed"
    npm run lint
    exit 1
fi

echo ""
echo "📝 Type checking..."
if npm run type-check > /dev/null 2>&1; then
    print_status "PASS" "Type checking passed"
else
    print_status "FAIL" "Type checking failed"
    npm run type-check
    exit 1
fi

echo ""
echo "🛡️ Security audit..."
if npm audit > /dev/null 2>&1; then
    print_status "PASS" "Security audit passed"
else
    print_status "WARN" "Security vulnerabilities found (check with 'npm audit')"
fi

echo ""
echo "📦 Dry run packaging..."
if npm pack --dry-run > /dev/null 2>&1; then
    print_status "PASS" "Package dry run successful"
else
    print_status "FAIL" "Package dry run failed"
    npm pack --dry-run
    exit 1
fi

# Check package contents
echo ""
echo "📋 Package contents:"
PACKAGE_FILE=$(npm pack --dry-run 2>/dev/null | tail -1)
if [ -n "$PACKAGE_FILE" ]; then
    echo "Package file: $PACKAGE_FILE"
    tar -tf "$PACKAGE_FILE" | head -10
    echo "... (showing first 10 files)"
    rm -f "$PACKAGE_FILE"
fi

echo ""
echo "📊 Coverage check..."
COVERAGE_OUTPUT=$(npm run test:coverage 2>/dev/null | grep -E "All files|src" | tail -1)
if echo "$COVERAGE_OUTPUT" | grep -q "100\|9[0-9]\|8[0-9]"; then
    print_status "PASS" "Coverage meets threshold"
else
    print_status "WARN" "Coverage may be low: $COVERAGE_OUTPUT"
fi

echo ""
echo "=== PRE-PUBLISH CHECKLIST ==="
echo "✅ All tests passing"
echo "✅ Build successful"
echo "✅ Linting passed"
echo "✅ Type checking passed"
echo "✅ Package name correct: $PACKAGE_NAME"
echo "✅ Working directory clean"
echo "✅ On master branch"
echo "✅ Logged into npm"
echo "✅ Package dry run successful"

echo ""
print_status "PASS" "All pre-publish checks passed!"
echo ""
echo "🚀 Ready to publish!"
echo "Run: npm publish"
echo ""
echo "📝 After publishing, don't forget to:"
echo "   - Tag the release: git tag v\$(npm run version --silent)"
echo "   - Push tags: git push origin --tags"
echo "   - Test installation: npm install -g $PACKAGE_NAME"
echo "   - Verify execution: $PACKAGE_NAME --help"
