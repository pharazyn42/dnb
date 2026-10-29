@echo off
rem Runs the Strudel loop exporter. Usage: export-loops.cmd <workbench.strudel.js> [options]
node "%~dp0export-loops.mjs" %*
