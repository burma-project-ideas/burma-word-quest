[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param()

$ErrorActionPreference = 'Stop'
$workspacePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\', '/')
$artifactPaths = @('.claude-flow', '.claude', '.swarm', 'output', 'src/.claude', 'supabase/.temp')

try {
Get-Command git -ErrorAction Stop | Out-Null
$gitRoot = & git -C $workspacePath rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($gitRoot).TrimEnd('\', '/') -ne $workspacePath) {
    throw 'The script must be in the scripts folder of the intended Git repository.'
}

# Validate every target before removing any folder.
$targets = foreach ($relativePath in $artifactPaths) {
    $targetPath = [IO.Path]::GetFullPath((Join-Path $workspacePath $relativePath))
    if (-not $targetPath.StartsWith($workspacePath + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Target is outside the project: $targetPath"
    }
    $trackedFiles = @(& git -C $workspacePath ls-files -- $relativePath)
    if ($LASTEXITCODE -ne 0 -or $trackedFiles.Count -gt 0) {
        throw "Cannot safely delete a target containing tracked files: $relativePath"
    }
    if (-not (Test-Path -LiteralPath $targetPath)) {
        Write-Host "Already absent: $relativePath"
        continue
    }
    $item = Get-Item -LiteralPath $targetPath -Force
    if (-not $item.PSIsContainer) { throw "Expected a directory: $targetPath" }
    $entries = @($item) + @(Get-ChildItem -LiteralPath $targetPath -Force -Recurse)
    if ($entries | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) {
        throw "Target contains a symbolic link or junction: $targetPath"
    }
    $targetPath
}

foreach ($targetPath in $targets) {
    if ($PSCmdlet.ShouldProcess($targetPath, 'Permanently delete local artifacts, including every file under output')) {
        Remove-Item -LiteralPath $targetPath -Recurse -Force
        Write-Host "Removed: $targetPath"
    }
}

Write-Host "`nFinal Git status:"
& git -C $workspacePath status --short
if ($LASTEXITCODE -ne 0) { throw 'Could not read the final Git status.' }
Write-Host "`nFinished." -ForegroundColor Green
}
catch {
    Write-Host "`nCleanup stopped: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Write-Host "`nPress any key to continue . . ." -NoNewline
    try { [Console]::ReadKey($true) | Out-Null }
    catch { Read-Host 'Press Enter' | Out-Null }
    Write-Host ''
}
