SET /P STOREDPATH=<"%USERPROFILE%\.exponent\PATH"
SET PATH="\"%PATH%;%STOREDPATH%\""
exp prepare-detached-build --platform android
