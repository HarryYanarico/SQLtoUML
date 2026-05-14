@echo off
echo Starting SQL to UML converter...
cd /d "%~dp0"
call npm install
call npm run dev