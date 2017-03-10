SET /P STOREDPATH=<"%USERPROFILE%\.expo\PATH"
SET PATH="\"%PATH%;%STOREDPATH%\""
exp prepare-detached-build --platform android
