#!/usr/bin/env pwsh
# Fake installer used by unit tests. Mirrors the real installer's contract:
# logs on stderr, key=value result on stdout.
[CmdletBinding()]
param(
    [string]$Version = "latest",
    [string]$InstallRoot = ""
)

if (-not $InstallRoot) {
    [Console]::Error.WriteLine("install.ps1: missing -InstallRoot")
    exit 1
}
if ($Version -eq "latest") {
    $Version = "9.9.9"
}
if ($env:FAKE_INSTALLER_FAIL -eq "1") {
    [Console]::Error.WriteLine("install.ps1: simulated failure")
    exit 1
}

[Console]::Error.WriteLine("install.ps1: fake install of $Version")
Write-Output "version=$Version"
Write-Output "target=testos-x86_64"
Write-Output "bin_dir=$InstallRoot\$Version\testos-x86_64\cloudsmith"
Write-Output "executable=$PSScriptRoot\cloudsmith.cmd"
