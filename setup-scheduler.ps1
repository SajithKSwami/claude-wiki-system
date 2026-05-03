# setup-scheduler.ps1
# Registers a Windows Task Scheduler job to run daily-logger.mjs at 11:00 PM every day
# Run once from a normal (non-admin) PowerShell window

$TaskName = "Claude-Wiki-Daily-Logger"
$ScriptPath = "C:\Users\Sajithkumar Swami\wiki\daily-logger.mjs"
$NodePath = "C:\Program Files\nodejs\node.exe"
$LogPath = "C:\Users\Sajithkumar Swami\wiki\daily-logger.log"

if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: daily-logger.mjs not found at $ScriptPath"
    exit 1
}

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task: $TaskName"
}

$Action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory "C:\Users\Sajithkumar Swami\wiki"

$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -RunOnlyIfNetworkAvailable:$false

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Appends Claude daily activity to wiki/log.md at 11 PM" `
    -RunLevel Limited

Write-Host ""
Write-Host "✓ Task '$TaskName' registered. Runs daily at 11:00 PM."
Write-Host "  Log: $LogPath"
Write-Host ""
Write-Host "Test it now:"
Write-Host "  node `"$ScriptPath`""
