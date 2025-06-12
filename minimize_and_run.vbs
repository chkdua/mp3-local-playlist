Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c php -S localhost:8090", 7, false
