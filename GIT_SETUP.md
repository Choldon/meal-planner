# Git Setup Guide

Follow these steps to set up Git and push your code to GitHub.

## Step 1: Initialize Git Repository

Open your terminal and navigate to the meal-planner directory:

```bash
cd meal-planner
```

Initialize Git:

```bash
git init
```

You should see: `Initialized empty Git repository in /path/to/meal-planner/.git/`

## Step 2: Verify .gitignore

Make sure `.gitignore` exists and contains the right files:

```bash
cat .gitignore
```

You should see `node_modules/`, `.env.local`, etc. listed.

**Important**: This prevents sensitive files from being uploaded to GitHub!

## Step 3: Add All Files

Add all files to Git:

```bash
git add .
```

Check what will be committed:

```bash
git status
```

You should see:
- ✅ All source files (src/, public/, etc.)
- ✅ Configuration files (package.json, README.md, etc.)
- ❌ NOT node_modules/
- ❌ NOT .env.local

## Step 4: Create First Commit

```bash
git commit -m "Initial commit: Meal planner app with Supabase integration"
```

## Step 5: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `meal-planner`
   - **Description**: "A collaborative meal planning app for Kit & Jess"
   - **Visibility**: 
     - **Private** (recommended - keeps your data private)
     - Or **Public** (if you want to share with others)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 6: Connect Local Repository to GitHub

GitHub will show you commands. Use the "push an existing repository" section:

```bash
# Add GitHub as remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/meal-planner.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/kitsmith/meal-planner.git
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)

### Creating a Personal Access Token

If you don't have a token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Meal Planner Deployment"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 7: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files
3. Check that `.env.local` is **NOT** there (it should be ignored)
4. Verify `README.md` displays correctly

## Future Git Workflow

### Making Changes

```bash
# Make changes to your code
# Test locally with: npm start

# Check what changed
git status

# Add changes
git add .

# Commit with a descriptive message
git commit -m "Add feature: Edit shopping list quantities"

# Push to GitHub
git push origin main
```

### Viewing History

```bash
# See commit history
git log

# See recent commits (prettier)
git log --oneline --graph --decorate --all

# See what changed in last commit
git show
```

### Undoing Changes

```bash
# Undo uncommitted changes to a file
git checkout -- filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1
```

### Creating Feature Branches

For larger features, use branches:

```bash
# Create and switch to new branch
git checkout -b feature/google-calendar

# Make changes and commit
git add .
git commit -m "Add Google Calendar integration"

# Push branch to GitHub
git push origin feature/google-calendar

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/google-calendar

# Push merged changes
git push origin main

# Delete feature branch (optional)
git branch -d feature/google-calendar
```

## Common Issues

### Issue: "Permission denied"

**Solution**: Use a Personal Access Token instead of your password

### Issue: "Repository not found"

**Solution**: Check the repository URL is correct:
```bash
git remote -v
```

If wrong, update it:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/meal-planner.git
```

### Issue: "Failed to push some refs"

**Solution**: Pull first, then push:
```bash
git pull origin main --rebase
git push origin main
```

### Issue: ".env.local was uploaded to GitHub"

**URGENT - Remove it immediately:**

```bash
# Remove from Git (but keep local file)
git rm --cached .env.local

# Commit the removal
git commit -m "Remove .env.local from repository"

# Push
git push origin main

# Then go to GitHub → Settings → Secrets and rotate your Supabase keys!
```

## Best Practices

1. ✅ **Commit often** - Small, focused commits are better
2. ✅ **Write clear commit messages** - Describe what and why
3. ✅ **Test before committing** - Make sure code works
4. ✅ **Never commit secrets** - Use .gitignore and environment variables
5. ✅ **Pull before push** - Avoid conflicts
6. ✅ **Use branches for features** - Keep main stable

## Commit Message Examples

Good commit messages:
```bash
git commit -m "Add edit functionality to shopping list items"
git commit -m "Fix: Calendar not showing meals for current week"
git commit -m "Update: Change color palette to earthy tones"
git commit -m "Docs: Add deployment guide for Render"
```

Bad commit messages:
```bash
git commit -m "fix"
git commit -m "updates"
git commit -m "asdf"
git commit -m "changes"
```

## Next Steps

After setting up Git:

1. ✅ Verify code is on GitHub
2. ✅ Proceed to deploy on Render (see DEPLOYMENT.md)
3. ✅ Set up automatic deployments
4. ✅ Start using feature branches for new features

## Quick Reference

```bash
# Status
git status                    # See what changed
git log --oneline            # See commit history

# Basic workflow
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push origin main         # Push to GitHub

# Branches
git branch                   # List branches
git checkout -b name         # Create new branch
git checkout main            # Switch to main
git merge branch-name        # Merge branch

# Undo
git checkout -- file         # Discard changes to file
git reset --soft HEAD~1      # Undo last commit (keep changes)

# Remote
git remote -v                # Show remote URLs
git pull origin main         # Pull latest changes
```

---

Need help? Check the [Git documentation](https://git-scm.com/doc) or ask for assistance!