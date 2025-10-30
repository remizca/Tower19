# File linking notes

This short note explains the `TODO.md` linking approach used in the repository and why a *hard link* was chosen.

## What was done
- A hard link was created so the root `TODO.md` and `docs/progress/TODO.md` point to the same underlying file data. Editing either file updates the same content.
- A backup of the original root file was created at `TODO.md.bak` before creating the link.

## Why a hard link
- On Windows, creating a symbolic link often requires Administrator privileges or Developer Mode enabled. That can be inconvenient when collaborators don't have admin privileges.
- A hard link is a simple, non-admin alternative on NTFS that makes two directory entries reference the same file record. It achieves the goal of having `TODO.md` accessible at the repository root while keeping the canonical file in `docs/progress/`.
- Hard links behave like normal files (there's no visible arrow marker) but share the same data; deleting one entry does not delete the data until all links are removed.

## How it was created (PowerShell)
The command used (already executed in this repo) was:

```powershell
# backup original
cp TODO.md TODO.md.bak
# remove root file and create a hard link pointing to the file in docs/progress
Remove-Item TODO.md
New-Item -ItemType HardLink -Path "TODO.md" -Target "docs\progress\TODO.md"
```

## How to create a symbolic link instead (requires admin or Developer Mode)
If you prefer a *symbolic link* (visibly a symlink and resolves differently on some tools), run:

```powershell
# remove the hard link or file first if present
Remove-Item TODO.md
# create a symbolic link (may require admin or Developer Mode)
New-Item -ItemType SymbolicLink -Path "TODO.md" -Target "docs\progress\TODO.md"
```

Note: Git will treat symlinks differently than hard links. On Windows, symlinks may appear as links and can be problematic if collaborators don't have symlink support.

## How to revert
To restore the original root file from the backup:

```powershell
Remove-Item TODO.md
Copy-Item TODO.md.bak TODO.md
```

Or to remove the link and keep the canonical file in `docs/progress/`:

```powershell
Remove-Item TODO.md
# keep docs/progress/TODO.md untouched
```

## Rationale summary
- Hard link used to avoid admin requirements and to keep a single canonical TODO file under `docs/progress/` while keeping the root path accessible.
- If you want the visible symlink behavior or prefer symlinks for your workflow, remove the hard link and create a symlink as described above.

If you'd like, I can:
- Remove the backup `TODO.md.bak` (it's currently in the repo working tree) or move it to `.gitignore`.
- Convert the hard link to a symlink for you (requires admin privileges to run locally), or provide a short script for collaborators to run.
- Update `docs/README.md` to reference this note.