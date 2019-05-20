---
title: Hosting An App on Your Servers
---

> **WARNING:** This feature is in beta.

Normally, when over-the-air (OTA) updates are enabled, your app will fetch JS bundles and assets from Expo’s CDN. However, there will be situations when you will want to host your JS bundles and assets on your own servers. For example, OTA updates are slow or unusable in countries that have blocked Expo’s CDN providers on AWS and Google Cloud. In these cases, you can host your app on your own servers to better suit your use case.

For simplicity, the rest of this article will refer to hosting an app for the Android platform, but you could swap out Android for iOS at any point and everything would still be true.

## Export app

First, you’ll need to export all the static files of your app so they can be served from your CDN. To do this, run `expo export --public-url <server-endpoint>` in your project directory and it will output all your app’s static files to a directory named `dist`.  In this guide, we will use `https://expo.github.io/self-hosting-example` as our example server endpoint. Asset and bundle files are named by the md5 hash of their content. Your output directory should look something like this now:
```
.
├── android-index.json
├── ios-index.json
├── assets
│   └── 1eccbc4c41d49fd81840aef3eaabe862
└── bundles
      ├── android-01ee6e3ab3e8c16a4d926c91808d5320.js
      └── ios-ee8206cc754d3f7aa9123b7f909d94ea.js
```

## Hosting your static files

Once you've exported your app's static files, you can host the contents on your own server. For example, in your `dist` output directory, an easy way to host your own files is to push the contents to Github. You can enable [Github Pages](https://pages.github.com/) to make your app available at a base URL like https://username.github.io/project-name. To host your files on Github, you'd do something like this:

```
# run this from your project directory
expo export --public-url https://expo.github.io/self-hosting-example

# commit output directory contents to your repo
cd dist
git init && git remote add origin git@github.com:expo/self-hosting-example.git
git add * && git commit -m "Update my app with this JS bundle"
git push origin master
```

To setup a QR code to view your hosted app, or if you want to host your files locally, follow the instructions below in the 'Loading QR Code/URL in Development' section.

## Build standalone app

In order to configure your standalone binary to pull OTA updates from your server, you’ll need to define the URL where you will host your `index.json` file. Pass the URL to your hosted `index.json` file to the `expo build` command.

For iOS builds, run the following commands from your terminal:
`expo build:ios --public-url <path-to-ios-index.json>`, where the `public-url` option will be something like https://expo.github.io/self-hosting-example/ios-index.json

For Android builds, run the following commands from your terminal:
`expo build:android --public-url <path-to-android-index.json>`, where the `public-url` option will be something like https://expo.github.io/self-hosting-example/android-index.json


## Loading QR Code/URL in Development

You can also load an app hosted on your own servers as a QR code/URL into the Expo mobile client for development purposes.

### QR code:
The URI you’ll use to convert to QR code will be deeplinked using the `exps`/`exp` protocol. Both `exps` and `exp` deeplink into the mobile app and perform a request using HTTPS and HTTP respectively. You can create your own QR code using an online QR code generator from the input URI.

#### Here’s an example of how you’d do this with a remote server:

URI: `exps://expo.github.io/self-hosting-example/android-index.json`

QR code: Generate the URI from a website like https://www.qr-code-generator.com/

#### Here’s an example of how you’d do this from localhost:

Run `expo export` in dev mode and then start a simple HTTP server in your output directory:

```
# Find your local IP address with `ipconfig getifaddr en0`
# export static app files
expo export --public-url http://`ipconfig getifaddr en0`:8000 --dev

# cd into your output directory
cd dist

# run a simple http server from output directory
python -m SimpleHTTPServer 8000
```

URI: `exp://192.xxx.xxx.xxx:8000/android-index.json` (find your local IP with a command like `ipconfig getifaddr en0`)

QR code: Generate a QR code using your URI from a website like https://www.qr-code-generator.com/

### URL
If you are loading in your app into the expo client by passing in a URL string, you will need to pass in an URL pointing to your json file.

Here is an example URL from a remote server: [https://expo.github.io/self-hosting-example/android-index.json](https://expo.github.io/self-hosting-example/android-index.json)

Here is an example URL from localhost: `http://localhost:8000/android-index.json`

## Advanced Topics
### Debugging
When we bundle your app, minification is always enabled. In order to see the original source code of your app for debugging purposes, you can generate source maps. Here is an example workflow:

1. Run `expo export --dump-sourcemap --public-url <your-url>`. This will also export your bundle sourcemaps in the `bundles` directory.
2. A `debug.html` file will also be created at the root of your output directory.
3. In Chrome, open up `debug.html` and navigate to the `Source` tab. In the left tab there should be a resource explorer with a red folder containing the reconstructed source code from your bundle.

![Debugging Source Code](/static/images/host-your-app-debug.png)

### Multimanifests
As new Expo SDK versions are released, you may want to serve multiple versions of your app from your server endpoint. For example, if you first released your app with SDK 29 and later upgraded to SDK 30, you'd want users with your old standalone binary to receive the SDK 29 version, and those with the new standalone binary to receive the SDK 30 version.  
In order to do this, you can run `expo export` with some merge flags to combine previously exported apps into a single multiversion app which you can serve from your servers.

Here is an example workflow:  
1. Release your app with previous Expo SDKs. For example, when you released SDK 29, you can run `expo export --output-dir sdk29 --public-url <your-public-url>`. This exports the current version of the app (SDK 29) to a directory named `sdk29`.

2. Update your app and include previous Expo SDK versions. For example, if you've previously released SDK 28 and 29 versions of your app, you can include them when you release an SDK 30 version by running `expo export --merge-src-dir sdk29 --merge-src-dir sdk28 --public-url <your-url>`. Alternatively, you could also compress and host the directories and run `expo export --merge-src-url https://examplesite.com/sdk29.tar.gz --merge-src-url https://examplesite.com/sdk28.tar.gz --public-url <your-url>`. This creates a multiversion app in the `dist` output directory. The `asset` and `bundle` folders contain everything that the source directories had, and the `index.json` file contains an array of the individual `index.json` files found in the source directories.

### Asset Hosting
By default, all assets are hosted from an `assets` path resolving from your `public-url` (e.g. https://expo.github.io/self-hosting-example/assets).  You can override this behavior in the `assetUrlOverride` field of your `android-index.json`. All relative URL's will be resolved from the `public-url`.

### Special fields
Most of the fields in the `index.json` files are the same as in `app.json`. Here are some fields that are notable in `index.json`:
- `revisionId`, `commitTime`, `publishedTime`: These fields are generated by `expo export` and used to determine whether or not an OTA update should occur.
- `bundleUrl`: This points to the path where the app's bundles are hosted. They are also used to determined whether or not an OTA update should occur.
- `slug`: This should not be changed. Your app is namespaced by `slug`, and changing this field will result in undefined behavior in the Expo SDK components such as `Filesystem`.
- `assetUrlOverride`: The path which assets are hosted from. It is by default `./assets`, which is resolved relative to the base `public-url` value you initially passed in.
