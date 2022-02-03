#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    yarn
fi

../../tools/bin/expotools.js android-generate-dynamic-macros --configuration $1 --bare
echo " ✅ Generete dynamic macros"
