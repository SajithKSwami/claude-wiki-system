# setup-scheduler.ps1
# Registers a Windows Task Scheduler job to run daily-logger.mjs at 11:00 PM every day
# Run this once from PowerShell (no admin needed for current user tasks)

$TaskName = "Claude-Wiki-Daily-Logger"
$ScriptPath = "C:\Users\Sajithkumar Swami\wiki\daily-logger.mjs"
$NodePath = "C:\Program Files\nodejs\node.exe"
$LogPath = "C:\Users\Sajithkumar Swami\wiki\daily-logger.log"

# Copy the script to wiki folder if not already there
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: daily-logger.mjs not found at $ScriptPath"
    Write-Host "Please copy daily-logger.mjs to your wiki folder first."
    exit 1
}

# Remove existing task if present
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task: $TaskName"
}

# Create the action — runs node daily-logger.mjs, logs output
$Action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$ScriptPath`" >> `"$LogPath`" 2>&1" `
    -WorkingDirectory "C:\Users\Sajithkumar Swami\wiki"

# Trigger — 11:00 PM daily
$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

# Settings — run even if on battery, don't stop if idle ends
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -RunOnlyIfNetworkAvailable:$false

# Register
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Appends Claude daily activity summary to wiki/log.md at 11 PM" `
    -RunLevel Limited

Write-Host ""
Write-Host "Task '$TaskName' registered successfully."
Write-Host "Runs daily at 11:00 PM."
Write-Host "Log output: $LogPath"
Write-Host ""
Write-Host "To run manually right now:"
Write-Host "  node `"$ScriptPath`""
Write-Host ""
Write-Host "To check task status:"
Write-Host "  Get-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "To remove the task:"
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
