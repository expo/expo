---
title: How Expo Works
---

While it's certainly not necessary to know any of this to use Expo, many engineers like to know how their tools work. We'll walk through a few key concepts here, including:

- Local development of your app
- Publishing/deploying a production version of your app
- How Expo manages changes to its SDK
- Opening Expo apps offline

You can also browse the source, fork, hack on and contribute to the Expo tooling on [github/expo](https://github.com/expo).

## Serving an Expo project for local development

There are two pieces here: the Expo app and Expo CLI. When you start an app with Expo CLI, you're running the Expo Development Server and Metro bundler.

![](/static/images/fetch-app-development.png)

> **Note:** Expo CLI also spawns a tunnel process, which allows devices outside of your LAN to access the above servers without you needing to change your firewall settings. If you want to learn more, see [ngrok](https://ngrok.com/).

### `Expo Development Server`

This server is the endpoint that you hit first when you type the URL into the Expo app. Its purpose is to serve the **Expo Manifest** and provide a communication layer between Expo CLI and the Expo app on your phone or simulator.

#### `Expo Manifest`

The following is an example of a manifest being served through Expo CLI. The first thing that you should notice is there are a lot of identical fields to **app.json** (see the [Configuration with app.json / app.config.js](configuration.md#exp) section if you haven't read it yet). These fields are taken directly from that file -- this is how the Expo app accesses your configuration.

```javascript
{
  "name":"My New Project",
  "description":"A starter template",
  "slug":"my-new-project",
  "sdkVersion":"18.0.0",
  "version":"1.0.0",
  "revisionId": "1.0.0-r.Qbp327ENxe",
  "orientation":"portrait",
  "primaryColor":"#cccccc",
  "icon":"https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png",
  "notification":{
    "icon":"https://s3.amazonaws.com/exp-us-standard/placeholder-push-icon.png",
    "color":"#000000"
  },
  "loading":{
    "icon":"https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
  },
  "entryPoint": "node_modules/expo/AppEntry.js",
  "packagerOpts":{
    "hostType":"tunnel",
    "dev":false,
    "strict":false,
    "minify":false,
    "urlType":"exp",
    "urlRandomness":"2v-w3z",
    "lanType":"ip"
  },
  "developer":{
    "tool":"expo-cli"
  },
  "bundleUrl":"http://packager.2v-w3z.notbrent.internal.exp.direct:80/apps/new-project-template/main.bundle?platform=ios&dev=false&strict=false&minify=false&hot=false&includeAssetFileHashes=true",
  "debuggerHost":"packager.2v-w3z.notbrent.internal.exp.direct:80",
  "mainModuleName":"main",
  "logUrl":"http://2v-w3z.notbrent.internal.exp.direct:80/logs"
}
```

Every field in the manifest is some configuration option that tells Expo what it needs to know to run your app. The app fetches the manifest first and uses it to show your app's loading icon that you specified in **app.json**, then proceeds to fetch your app's JavaScript at the given `bundleUrl` -- this URL points to a local development server which you can use to interact with the Metro bundler.

In order to stream logs to Expo CLI, the Expo SDK intercepts calls to `console.log`, `console.warn`, etc. and posts them to the `logUrl` specified in the manifest. This endpoint is on the Expo Development Server.

### Metro bundler

If you use React Native without Expo, you would start the Metro bundler server by running `react-native start` in your project directory. Expo starts this up for you and configures it using [@expo/metro-config](../../guides/customizing-metro.md). This server has two purposes.

The first is to serve your app JavaScript compiled into a single file and translating any JavaScript code that you wrote which isn't compatible with your phone's JavaScript engine. JSX, for example, is not valid JavaScript -- it is a language extension that makes working with React components more pleasant and it compiles down into plain function calls -- so `<HelloWorld />` would become `React.createElement(HelloWorld, {}, null)` (see [JSX in Depth](https://facebook.github.io/react/docs/jsx-in-depth.html) for more information). Other language features like [async/await](https://blog.expo.dev/react-native-meets-async-functions-3e6f81111173#.4c2517o5m) are not yet available in most engines and so they need to be compiled down into JavaScript code that will run on your phone's JavaScript engine, JavaScriptCore.

The second purpose is to serve assets. When you include an image in your app, you will use syntax like `<Image source={require('./assets/example.png')} />`, and unless you have already cached that asset the app the import will be resolved to a URL that points to your Metro server.

> Expo CLI will also start Webpack to serve your project on the web, if you are using that feature. It's behavior is very similar to what is described above for Metro bundler.

## Publishing/Deploying an Expo app in Production

When you publish an Expo app, we compile it into a JavaScript bundle with production flags enabled. That is, we minify the source and we tell Metro to build in production mode (which in turn sets [`__DEV__`](https://reactnative.dev/docs/javascript-environment.html#polyfills) to `false` amongst other things). After compilation, we upload that bundle, along with any assets that it requires (see [Assets](../guides/assets.md)) to CloudFront. We also upload your [Manifest](#expo-manifest) (including most of your **app.json** configuration) to our server. This manifest will include a `revisionId` key which is a unique string (generated by Expo) you can use to identify a specific release of your app, just in case you didn't increment your app's `version` key. When publishing is complete, we'll give you a URL to your app which you can send to anybody who has the Expo Go app.

> **Note:** By default, all Expo projects are `unlisted`, which means that publishing does not make it publicly searchable or discoverable anywhere. It is up to you to share the link. You can change this setting in [app.json](configuration.md).

As soon as the publish is complete, the new version of your code is available to all your existing users. They'll download the updated version next time they open the app or refresh it, provided that they have a version of the Expo Go app that supports the `sdkVersion` specified in your **app.json**.

Updates are handled differently on iOS and Android. On Android, updates
are downloaded in the background. This means that the first time a user opens
your app after an update they will get the old version while the new version
is downloaded in the background. The second time they open the app they'll get
the new version. On iOS, updates are downloaded synchronously, so users will
get the new version the first time they open your app after an update.

> **Note:** To package your app for deployment on the Apple App Store or Google Play Store, see [Creating your first build](/build/setup.md). Each time you update the SDK version you will need to rebuild your binary.

## SDK Versions

The `sdkVersion` of an Expo app indicates what version of the compiled ObjC/Java/C layer of Expo to use. Each `sdkVersion` roughly corresponds to a release of React Native plus the Expo libraries in the SDK section of these docs.

Expo Go supports many versions of the Expo SDK, but a project can only use one at a time. This allows you to publish your project today and still have it work a year from now without any changes, even if we have completely revamped or removed an API your project depends on in a new version. This is possible because your project will always be running against the same compiled code as the day that you published it.

If you publish an update to your app with a new `sdkVersion`, if a user has yet to update to the latest version of Expo Go then they will still be able to use the previous `sdkVersion`.

> **Note:** It's likely that eventually we will formulate a policy for how long we want to keep around sdkVersions and begin pruning very old versions of the sdk from the client, but until we do that, everything will remain backwards compatible.

## Opening a deployed Expo app

The process is essentially the same as opening an Expo app in development, only now we hit an Expo server to get the manifest, and manifest points us to CloudFront to retrieve your app's JavaScript.

![](/static/images/fetch-app-production.png)

## Opening Expo Apps Offline

Expo Go will automatically cache the most recent update of every project it has opened. When you try to open an Expo project, it will always try and fetch the latest update, but if that fails for whatever reason (including being totally offline) then it will load the most recent cached update.

If you build a standalone app with Expo, that standalone binary will also ship with a "pre-cached" version of your JavaScript so that it can cold launch the very first time with no internet. Continue reading for more information about standalone apps.

## Standalone Apps

You can also package your Expo app into a standalone binary for submission to the Apple iTunes Store or Google Play.

There are two options to choose from when it comes to building your Expo app:

- (**Recommended**) The new EAS Build system, which has support for any 3rd party library. For more information, see [Creating your first build](/build/setup.md).
- The classic `expo build` system, which only supports native libraries included in the Expo SDK. For more information on classic builds, see [here](/classic/building-standalone-apps.md).
