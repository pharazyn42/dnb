@echo off
rem Runs song QA. Usage: qa.cmd <track>.song.json
node "%~dp0qa.mjs" %*
