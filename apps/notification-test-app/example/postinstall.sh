#!/bin/sh

mkdir react-native
cp postinstall.package.json react-native/package.json
cd react-native
yarn
cp -r node_modules/react-native/ ../node_modules/react-native
cd ..
rm -rf react-native
cd "node_modules/.bin"
ln -s "../react-native/cli.js" react-native
cd ../../