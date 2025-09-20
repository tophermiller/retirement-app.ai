@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: cloudfront-invalidate.bat
:: Usage:
::   cloudfront-invalidate.bat BUCKET_NAME [PATH ...]
::
:: Example:
::   cloudfront-invalidate.bat www-retirementodds-com
::   cloudfront-invalidate.bat www-retirementodds-info /index.html /app/*

:: ---- Check args ----
if "%~1"=="" (
  echo [ERROR] Missing S3 bucket name.
  echo Usage: %~nx0 BUCKET_NAME [PATH ...]
  exit /b 2
)
set "BUCKET_NAME=%~1"
shift

:: ---- Map S3 bucket names to CloudFront distribution IDs ----
if /I "%BUCKET_NAME%"=="www-retirementodds-com" (
  set "DIST_ID=E9AN8X8F8GETG"
) else if /I "%BUCKET_NAME%"=="www-retirementodds-info" (
  set "DIST_ID=EMH7HYVCPNTW1"
) else if /I "%BUCKET_NAME%"=="staging-retirementodds-com" (
  set "DIST_ID=EQX9DGPOJX9WI"
) else if /I "%BUCKET_NAME%"=="staging-retirementodds-info" (
  set "DIST_ID=E1G8K4VALXW0C8"
) else (
  echo [ERROR] Unknown bucket name: %BUCKET_NAME%
  echo Please add a mapping for this bucket in the script.
  exit /b 5
)

echo [INFO] Bucket %BUCKET_NAME% maps to CloudFront distribution %DIST_ID%


:: ---- Build paths list (default to /* if none given) ----
set "PATHS="
if "%~1"=="" (
  set "PATHS=/*"
) else (
  :collect_paths
  set "PATHS=!PATHS! %~1"
  shift
  if not "%~1"=="" goto collect_paths
)

:: ---- Check AWS CLI availability ----
aws --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] AWS CLI not found in PATH.
  exit /b 3
)

:: ---- Timestamp for caller reference (must be unique per request) ----
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TS=%%I"
set "CALLER_REF=%BUCKET_NAME%-%TS%"

echo [INFO] Creating invalidation on %DIST_ID% for paths:%PATHS%
echo [INFO] Caller reference: %CALLER_REF%

:: ---- Create the invalidation and capture its ID ----
for /f "usebackq tokens=*" %%I in (`
  aws cloudfront create-invalidation ^
    --distribution-id "%DIST_ID%" ^
    --paths %PATHS% ^
    --query "Invalidation.Id" --output text
`) do set "INVALIDATION_ID=%%I"

if not defined INVALIDATION_ID (
  echo [ERROR] Failed to create invalidation. See any errors above.
  exit /b 4
)

echo [INFO] Invalidation created: %INVALIDATION_ID%
echo [INFO] Waiting for completion...

:: ---- Poll until status is Completed ----
:wait_loop
for /f "usebackq tokens=*" %%S in (`aws cloudfront get-invalidation ^
  --distribution-id "%DIST_ID%" ^
  --id "%INVALIDATION_ID%" ^
  --query "Invalidation.Status" --output text`) do set "STATUS=%%S"

if /I "!STATUS!"=="Completed" (
  echo [INFO] Invalidation %INVALIDATION_ID% status: Completed
  goto :done
) else (
  echo [INFO] Current status: !STATUS!  (checking again in 5s)
  timeout /t 5 >nul
  goto :wait_loop
)

:done
echo [OK] CloudFront invalidation completed.
exit /b 0
