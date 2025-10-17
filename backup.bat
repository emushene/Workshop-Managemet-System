@echo OFF
SETLOCAL

REM -- Configuration --
SET DB_FILE=server\database.sqlite
SET BACKUP_DIR=backup
SET RETENTION_DAYS=30
SET DATE_FORMAT=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%
SET BACKUP_FILE=%BACKUP_DIR%\db_backup_%DATE_FORMAT%.sqlite

REM -- Create backup directory if it doesn't exist --
IF NOT EXIST "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

REM -- Create backup --
echo "Creating backup of %DB_FILE% to %BACKUP_FILE%..."
copy "%DB_FILE%" "%BACKUP_FILE%"
echo "Backup created."

REM -- Delete old backups --
echo "Deleting backups older than %RETENTION_DAYS% days..."
forfiles /p "%BACKUP_DIR%" /s /m *.* /d -%RETENTION_DAYS% /c "cmd /c del @path"
echo "Cleanup complete."

ENDLOCAL
