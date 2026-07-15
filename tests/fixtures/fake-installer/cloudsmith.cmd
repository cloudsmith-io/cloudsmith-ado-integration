@echo off
if "%FAKE_CLOUDSMITH_FAIL%"=="1" (
  echo cloudsmith: authentication failed 1>&2
  exit /b 1
)
if not "%CLOUDSMITH_API_KEY%"=="" (
  echo You are authenticated as fake-user (%*).
  exit /b 0
)
if not "%CLOUDSMITH_ORG%"=="" if not "%CLOUDSMITH_SERVICE_SLUG%"=="" if not "%SYSTEM_OIDCREQUESTURI%"=="" if not "%SYSTEM_ACCESSTOKEN%"=="" (
  echo You are authenticated as fake-service (%*).
  exit /b 0
)
echo cloudsmith: no auth environment provided 1>&2
exit /b 1
