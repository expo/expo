#! /bin/sh
for pkg in $1
do
  (cd packages/$pkg && yarn prepare) && rm -Rf ../social-app/node_modules/$pkg && cp -R packages/$pkg ../social-app/node_modules/$pkg
done
