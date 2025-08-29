# 📦 **Automated Publishing Workflow for ContextEngine MCP**

## **🎯 Overview**
This workflow automates the entire publishing process through GitHub Actions, ensuring consistent, safe releases with minimal manual intervention.

---

## **🔄 Automated Workflow**

### **Phase 1: Development & Automated Testing**

#### **Step 1: Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

#### **Step 2: Make Changes & Push**
```bash
# Make your changes
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

#### **Step 3: Automated CI/CD Pipeline**
- **GitHub Actions automatically runs**:
  - ✅ All tests (`npm run test:run`)
  - ✅ Build validation (`npm run build`)
  - ✅ Linting (`npm run lint`)
  - ✅ Type checking (`npm run type-check`)
  - ✅ Security audit (`npm audit`)
  - ✅ Coverage reporting
  - ✅ Performance tests

#### **Step 4: Pull Request Review**
- **Automated checks must pass**
- **Code review required**
- **Merge to master**

---

### **Phase 2: Automated Release Process**

#### **Step 5: Create GitHub Release**
1. **Check package.json version**: `npm run version --silent` (e.g., `1.0.0`)
2. **Go to GitHub → Releases → "Create a new release"**
3. **Tag**: `v1.0.0` (must match package.json version with 'v' prefix)
4. **Title**: `Release v1.0.0`
5. **Description**: Add release notes
6. **Publish release**

#### **Step 6: Automated Publishing Pipeline**
**GitHub Actions automatically:**
- ✅ **Runs pre-publish validation** (`npm run pre-publish`)
- ✅ **Builds the project** (`npm run build`)
- ✅ **Runs all tests** (`npm run test:run`)
- ✅ **Publishes to npm** (`npm publish`)
- ✅ **Verifies publication** (`npm view context-engine`)
- ✅ **Tests installation** (`npm install -g context-engine`)
- ✅ **Tests execution** (`context-engine --help`)
- ✅ **Sends notifications**

---

### **Phase 3: Post-Release Verification**

#### **Step 7: Automated Verification**
- **Package available on npm**: https://www.npmjs.com/package/context-engine
- **Installation tested**: `npm install -g context-engine`
- **Execution tested**: `context-engine --help`
- **Release notes published**: GitHub release page

---

## **🚀 Quick Release Commands**

### **For Bug Fixes (Patch Release):**
```bash
# 1. Create release branch
git checkout -b release/v1.0.1

# 2. Update version
npm version patch

# 3. Push and create PR
git push origin release/v1.0.1
# Create PR, review, merge

# 4. Check version and create GitHub release
npm run version --silent  # e.g., outputs: 1.0.1
# Go to GitHub → Releases → Create v1.0.1 (must match package.json)
# GitHub Actions will automatically publish to npm
```

### **For New Features (Minor Release):**
```bash
# 1. Create release branch
git checkout -b release/v1.1.0

# 2. Update version
npm version minor

# 3. Push and create PR
git push origin release/v1.1.0
# Create PR, review, merge

# 4. Check version and create GitHub release
npm run version --silent  # e.g., outputs: 1.1.0
# Go to GitHub → Releases → Create v1.1.0 (must match package.json)
# GitHub Actions will automatically publish to npm
```

### **For Breaking Changes (Major Release):**
```bash
# 1. Create release branch
git checkout -b release/v2.0.0

# 2. Update version
npm version major

# 3. Push and create PR
git push origin release/v2.0.0
# Create PR, review, merge

# 4. Check version and create GitHub release
npm run version --silent  # e.g., outputs: 2.0.0
# Go to GitHub → Releases → Create v2.0.0 (must match package.json)
# GitHub Actions will automatically publish to npm
```

### **For Release Candidates (RC):**
```bash
# 1. Create RC branch
git checkout -b release/v2.0.0-rc.1

# 2. Update version with RC suffix
npm version prerelease --preid=rc  # e.g., 2.0.0 → 2.0.0-rc.1

# 3. Push and create PR
git push origin release/v2.0.0-rc.1
# Create PR, review, merge

# 4. Check version and create GitHub release
npm run version --silent  # e.g., outputs: 2.0.0-rc.1
# Go to GitHub → Releases → Create v2.0.0-rc.1 (must match package.json)
# GitHub Actions will automatically publish to npm with RC tag
```

---

## **🔧 Manual Override (If Needed)**

### **Emergency Manual Publishing:**
```bash
# Only use if automated pipeline fails
npm run pre-publish  # Run all checks
npm publish          # Publish manually
git tag v$(npm run version --silent)
git push origin --tags
```

## **🎯 Release Candidate (RC) Workflow**

### **RC Publishing Behavior:**
- **RC versions** are published to npm with `--tag rc`
- **Users can install** with: `npm install context-engine@rc`
- **Default installs** still get the latest stable version
- **RC versions** don't affect the `latest` tag

### **RC Release Process:**
```bash
# 1. Create RC branch
git checkout -b release/v2.0.0-rc.1

# 2. Update version to RC
npm version prerelease --preid=rc  # 2.0.0 → 2.0.0-rc.1

# 3. Push and create PR
git push origin release/v2.0.0-rc.1
# Create PR, review, merge

# 4. Create GitHub release
npm run version --silent  # Check: 2.0.0-rc.1
# Go to GitHub → Releases → Create v2.0.0-rc.1
# GitHub Actions publishes with RC tag
```

### **Testing RC Releases:**
```bash
# Install RC version
npm install context-engine@rc

# Test RC functionality
context-engine --help

# Install specific RC version
npm install context-engine@2.0.0-rc.1
```

### **Promoting RC to Stable:**
```bash
# 1. Create stable release branch
git checkout -b release/v2.0.0

# 2. Update to stable version (remove RC suffix)
npm version patch  # or minor/major as needed

# 3. Push and create PR
git push origin release/v2.0.0
# Create PR, review, merge

# 4. Create stable GitHub release
npm run version --silent  # Check: 2.0.0
# Go to GitHub → Releases → Create v2.0.0
# GitHub Actions publishes to latest tag
```

## **⚠️ Demoting Stable to RC (Emergency)**

### **When to Demote:**
- Critical bugs found after release
- Security vulnerabilities discovered
- Breaking changes that weren't caught in testing

### **Automated Demotion Process:**
```bash
# Use the automated script
npm run demote-to-rc 1.0.0 "Critical bug found in API response"

# Or run manually
./scripts/demote-to-rc.sh 1.0.0 "Critical bug found in API response"
```

### **What the Script Does:**
1. **Deprecates** the problematic stable version
2. **Creates** a new RC version
3. **Publishes** RC with proper tags
4. **Updates** latest tag to point to RC
5. **Creates** a PR for review

### **Manual Demotion (If Needed):**
```bash
# 1. Deprecate current version
npm deprecate context-engine@1.0.0 "Critical bug found. Use RC version."

# 2. Create RC version
npm version prerelease --preid=rc

# 3. Publish RC
npm publish --tag rc

# 4. Update latest tag
npm dist-tag add context-engine@1.0.0-rc.1 latest
```

---

## **📋 Automated Checks**

### **Pre-Publish Validation (Automatic):**
- [ ] **All tests pass** (123 tests)
- [ ] **Build successful** (TypeScript compilation)
- [ ] **Linting passes** (ESLint)
- [ ] **Type checking passes** (TypeScript)
- [ ] **Coverage meets threshold** (80%+)
- [ ] **Security audit passes** (npm audit)
- [ ] **On master branch**
- [ ] **Working directory clean**
- [ ] **Logged into npm**
- [ ] **Package name correct** (`context-engine`)
- [ ] **Repository URLs correct**
- [ ] **No sensitive data**
- [ ] **README.md included**
- [ ] **dist/ folder included**

### **Post-Publish Verification (Automatic):**
- [ ] **Package published successfully**
- [ ] **Installation tested**
- [ ] **Execution tested**
- [ ] **Release notes published**

---

## **🎯 GitHub Actions Workflows**

### **1. Test Workflow** (`.github/workflows/test.yml`)
- **Triggers**: Push to master, Pull requests
- **Runs**: Tests, linting, type checking, security audit
- **Matrix**: Node.js 18.x, 20.x, 22.x

### **2. Publish Workflow** (`.github/workflows/publish.yml`)
- **Triggers**: GitHub release published
- **Runs**: Pre-publish checks, npm publish, verification
- **Requires**: NPM_TOKEN secret

---

## **🔐 Required Setup**

### **GitHub Secrets:**
- `NPM_TOKEN`: Your npm authentication token

### **Branch Protection:**
- **Require pull request reviews**
- **Require status checks to pass**
- **Restrict pushes to master**

---

## **📊 Release Dashboard**

### **Automated Release Process:**
1. **Create GitHub Release** → Triggers workflow
2. **Pre-publish validation** → Ensures quality
3. **NPM publication** → Publishes to registry
4. **Installation verification** → Tests package
5. **Notification** → Confirms success

### **Release Timeline:**
- **GitHub Release**: 30 seconds
- **Pre-publish checks**: 2-3 minutes
- **NPM publication**: 1 minute
- **Verification**: 1 minute
- **Total time**: ~5 minutes

---

## **🚨 Emergency Procedures**

### **If Automated Publishing Fails:**
1. **Check GitHub Actions logs**
2. **Fix issues in code**
3. **Create new release**
4. **Re-run workflow**

### **If Published by Mistake:**
```bash
# Within 72 hours
npm unpublish context-engine@version

# After 72 hours
npm deprecate context-engine@version "Published by mistake"
```

---

## **✅ Success Criteria**

A successful automated release means:
- ✅ **All CI/CD checks pass automatically**
- ✅ **GitHub release created**
- ✅ **Package published to npm automatically**
- ✅ **Installation verified automatically**
- ✅ **Execution tested automatically**
- ✅ **Release notes published**
- ✅ **No manual intervention required**

**This automated workflow ensures consistent, reliable npm publishing with minimal manual steps!**

---

## **🚨 Safety Checks**

### **Before Publishing Checklist**
- [ ] **All tests pass** (`npm run test:run`)
- [ ] **Build successful** (`npm run build`)
- [ ] **No linting errors** (`npm run lint`)
- [ ] **Type checking passes** (`npm run type-check`)
- [ ] **Coverage meets threshold** (80%+)
- [ ] **Security audit passes** (`npm audit`)
- [ ] **Version updated** (`npm version`)
- [ ] **Documentation updated**
- [ ] **Package name correct** (`context-engine`)
- [ ] **Repository URLs correct**
- [ ] **No sensitive data** (API keys, passwords)
- [ ] **README.md included**
- [ ] **dist/ folder included**

### **Emergency Procedures**

#### **If Published by Mistake:**
```bash
# Within 72 hours - Unpublish
npm unpublish context-engine@version

# After 72 hours - Deprecate
npm deprecate context-engine@version "Published by mistake"
```

#### **If Name is Taken:**
- Use alternative name: `context-engine-mcp`
- Or contact npm support

---

## **📋 Automated Workflow Script**

Create a script to automate the pre-publish checks:

```bash
#!/bin/bash
# scripts/pre-publish.sh

echo "🔍 Running pre-publish checks..."

# Check if we're on master branch
if [[ $(git branch --show-current) != "master" ]]; then
    echo "❌ Must be on master branch to publish"
    exit 1
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Working directory not clean. Commit or stash changes."
    exit 1
fi

# Run all checks
echo "🧪 Running tests..."
npm run test:run || exit 1

echo "🔨 Building project..."
npm run build || exit 1

echo "🔍 Running linting..."
npm run lint || exit 1

echo "📝 Type checking..."
npm run type-check || exit 1

echo "🛡️ Security audit..."
npm audit || exit 1

echo "📦 Dry run packaging..."
npm pack --dry-run || exit 1

echo "✅ All checks passed! Ready to publish."
echo "Run: npm publish"
```

---

## **🎯 Branch Protection Rules**

Set up GitHub branch protection for `master`:
- **Require pull request reviews**
- **Require status checks to pass**
- **Require branches to be up to date**
- **Restrict pushes to master**
- **Require linear history**

---

## **📝 Commit Message Convention**

Use conventional commits:
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## **🚀 Quick Reference**

### **For Bug Fixes:**
```bash
git checkout -b fix/bug-description
# make changes
npm run test:run
git commit -m "fix: description"
git push origin fix/bug-description
# create PR, review, merge
npm version patch
npm publish
```

### **For New Features:**
```bash
git checkout -b feat/feature-name
# make changes
npm run test:run
git commit -m "feat: description"
git push origin feat/feature-name
# create PR, review, merge
npm version minor
npm publish
```

---

## **✅ Success Criteria**

A successful publish means:
- ✅ **All automated tests pass**
- ✅ **Code review completed**
- ✅ **Documentation updated**
- ✅ **Version properly incremented**
- ✅ **Package installs correctly**
- ✅ **Executable works as expected**
- ✅ **No sensitive data exposed**

**Follow this workflow to ensure safe, reliable npm publishing!**
