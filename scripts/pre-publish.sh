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

# Check if we're on master branch or in GitHub Actions
CURRENT_BRANCH=$(git branch --show-current)
if [ -n "$GITHUB_ACTIONS" ]; then
    # In GitHub Actions, we're typically on a detached HEAD for releases
    # Skip branch check for GitHub Actions as releases are created from tags
    print_status "PASS" "Running in GitHub Actions - release workflow"
else
    # Local development - must be on master branch
    if [ "$CURRENT_BRANCH" != "master" ]; then
        print_status "FAIL" "Must be on master branch to publish (currently on $CURRENT_BRANCH)"
        exit 1
    fi
    print_status "PASS" "On master branch"
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_status "FAIL" "Working directory not clean. Commit or stash changes."
    git status --short
    exit 1
fi
print_status "PASS" "Working directory is clean"

# Check if we're logged into npm or have NODE_AUTH_TOKEN
if [ -n "$NODE_AUTH_TOKEN" ]; then
    print_status "PASS" "Using NODE_AUTH_TOKEN for npm authentication"
elif ! npm whoami > /dev/null 2>&1; then
    print_status "FAIL" "Not logged into npm. Run 'npm login' first or set NODE_AUTH_TOKEN."
    exit 1
else
    print_status "PASS" "Logged into npm as $(npm whoami)"
fi

# Check package name
PACKAGE_NAME=$(node -p "require('./package.json').name")
if [ "$PACKAGE_NAME" != "context-engine" ]; then
    print_status "FAIL" "Package name should be 'context-engine', found: $PACKAGE_NAME"
    exit 1
fi
print_status "PASS" "Package name is correct: $PACKAGE_NAME"

# Check package version
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [ -z "$PACKAGE_VERSION" ] || [ "$PACKAGE_VERSION" = "undefined" ]; then
    print_status "FAIL" "Package version is not set in package.json"
    exit 1
fi
print_status "PASS" "Package version is set: $PACKAGE_VERSION"

# Check if package name is available (skip in GitHub Actions if no read access)
if [ -n "$GITHUB_ACTIONS" ]; then
    print_status "PASS" "Skipping package availability check in CI (requires npm read access)"
else
    if npm view "$PACKAGE_NAME" > /dev/null 2>&1; then
        print_status "WARN" "Package $PACKAGE_NAME already exists on npm"
    else
        print_status "PASS" "Package name $PACKAGE_NAME is available"
    fi
fi

echo ""
echo "🔨 Building project first..."
if npm run build > /dev/null 2>&1; then
    print_status "PASS" "Build successful for testing"
else
    print_status "FAIL" "Build failed"
    echo "Running build with full output:"
    npm run build
    exit 1
fi

echo ""
echo "🧪 Running tests..."
if npm run test:run > /dev/null 2>&1; then
    print_status "PASS" "All tests passed"
else
    print_status "FAIL" "Tests failed"
    echo "Running tests with full output:"
    npm run test:run
    exit 1
fi



# Verify build output exists
if [ ! -d "dist" ]; then
    print_status "FAIL" "Build output directory 'dist' not found"
    exit 1
fi
if [ ! -f "dist/index.js" ]; then
    print_status "FAIL" "Build output file 'dist/index.js' not found"
    exit 1
fi

# Check executable permissions
if [ ! -x "dist/index.js" ]; then
    print_status "WARN" "Build output file 'dist/index.js' is not executable"
    chmod +x dist/index.js
    print_status "PASS" "Made dist/index.js executable"
fi
print_status "PASS" "Build output verified"

echo ""
echo "🔍 Running linting..."
if npm run lint > /dev/null 2>&1; then
    print_status "PASS" "Linting passed"
else
    print_status "FAIL" "Linting failed"
    echo "Running lint with full output:"
    npm run lint
    exit 1
fi

echo ""
echo "📝 Type checking..."
if npm run type-check > /dev/null 2>&1; then
    print_status "PASS" "Type checking passed"
else
    print_status "FAIL" "Type checking failed"
    echo "Running type check with full output:"
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
if [ -n "$GITHUB_ACTIONS" ]; then
    # In CI, run coverage but don't fail on low coverage
    COVERAGE_OUTPUT=$(npm run test:coverage 2>/dev/null | grep -E "All files|src" | tail -1 || echo "Coverage check failed")
    if echo "$COVERAGE_OUTPUT" | grep -q "100\|9[0-9]\|8[0-9]"; then
        print_status "PASS" "Coverage meets threshold"
    else
        print_status "WARN" "Coverage may be low: $COVERAGE_OUTPUT"
    fi
else
    # Local development - run coverage check
    COVERAGE_OUTPUT=$(npm run test:coverage 2>/dev/null | grep -E "All files|src" | tail -1)
    if echo "$COVERAGE_OUTPUT" | grep -q "100\|9[0-9]\|8[0-9]"; then
        print_status "PASS" "Coverage meets threshold"
    else
        print_status "WARN" "Coverage may be low: $COVERAGE_OUTPUT"
    fi
fi

echo ""
echo "=== PRE-PUBLISH CHECKLIST ==="
echo "✅ All tests passing"
echo "✅ Build successful"
echo "✅ Linting passed"
echo "✅ Type checking passed"
echo "✅ Package name correct: $PACKAGE_NAME"
echo "✅ Working directory clean"
echo "✅ Branch check passed"
echo "✅ NPM authentication configured"
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
