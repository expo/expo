.. _how-exponent-works:

==================
How Exponent Works
==================

While it's certainly not necessary to know any of this to use Exponent, many
engineers like to know how their tools work. We'll walk through a few key
concepts here, including:

- Local development of your app
- Publishing/deploying a production version of your app
- How Exponent manages changes to its SDK
- Opening Exponent apps offline

You can also browse the source, fork, hack on and contribute to
the Exponent tooling on `github/@exponentjs <http://github.com/exponentjs>`_.

Serving an Exponent project for local development
"""""""""""""""""""""""""""""""""""""""""""""""""

.. image:: img/fetch-app-from-xde.png
  :width: 100%

There are two pieces here: the Exponent app and the Exponent
development tool (either XDE or ``exp`` CLI). We'll just assume XDE here for
simplicity of naming. When you open an app up in XDE, it spawns and manages two
server processes in the background: the Exponent Development Server and the
React Native Packager Server.

.. epigraph::
  **Note:** XDE also spawns a tunnel process, which allows devices outside of your LAN to access the the above servers without you needing to change your firewall settings. If you want to learn more, see `ngrok <https://ngrok.com>`_.

Exponent Development Server
'''''''''''''''''''''''''''

This server is the endpoint that you hit first when you type the URL into the
Exponent app. Its purpose is to serve the **Exponent Manifest** and provide
a communication layer between the XDE UI and the Exponent app on your phone or
simulator.

.. _exponent-manifest:
Exponent Manifest
-----------------

The following is an example of a manifest being served through XDE. The first thing
that you should notice is there are a lot of identical fields to ``exp.json`` (see
the :ref:`Configuration with exp.json <exp>` section if you haven't read it yet).
These fields are taken directly from that file -- this is how the Exponent app
accesses your configuration.

.. code-block:: json

  {
    "name":"My New Project",
    "description":"A starter template",
    "slug":"my-new-project",
    "sdkVersion":"8.0.0",
    "version":"1.0.0",
    "orientation":"portrait",
    "primaryColor":"#cccccc",
    "iconUrl":"https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png",
    "notification":{
      "iconUrl":"https://s3.amazonaws.com/exp-us-standard/placeholder-push-icon.png",
      "color":"#000000"
    },
    "loading":{
      "iconUrl":"https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png"
    },
    "entryPoint": "main.js",
    "packagerOpts":{
      "hostType":"tunnel",
      "dev":false,
      "strict":false,
      "minify":false,
      "urlType":"exp",
      "urlRandomness":"2v-w3z",
      "lanType":"ip"
    },
    "xde":true,
    "developer":{
      "tool":"xde"
    },
    "bundleUrl":"http://packager.2v-w3z.notbrent.internal.exp.direct:80/apps/new-project-template/main.bundle?platform=ios&dev=false&strict=false&minify=false&hot=false&includeAssetFileHashes=true",
    "debuggerHost":"packager.2v-w3z.notbrent.internal.exp.direct:80",
    "mainModuleName":"main",
    "logUrl":"http://2v-w3z.notbrent.internal.exp.direct:80/logs"
  }

Every field in the manifest is some configuration option that tells Exponent
what it needs to know to run your app. The app fetches the manifest first and
uses it to show your app's loading icon that you specified in ``exp.json``, then
proceeds to fetch your app's JavaScript at the given ``bundleUrl`` -- this
URL points to the React Native Packager Server.

In order to stream logs to XDE, the Exponent SDK intercepts calls to ``console.log``,
``console.warn``, etc. and posts them to the ``logUrl`` specified in the manifest.
This endpoint is on the Exponent Development Server.

React Native Packager Server
''''''''''''''''''''''''''''

If you use React Native without Exponent, you would start the packager by
running ``react-native start`` in your project directory. Exponent starts this
up for you and pipes ``STDOUT`` to XDE. This server has two purposes.

The first is to serve your app JavaScript compiled into a single file and
translating any JavaScript code that you wrote which isn't compatible with
your phone's JavaScript engine. JSX, for example, is not valid JavaScript --
it is a language extension that makes working with React components more
pleasant and it compiles down into plain function calls -- so ``<HelloWorld />``
would become ``React.createElement(HelloWorld, {}, null)`` (see `JSX in Depth
<https://facebook.github.io/react/docs/jsx-in-depth.html>`_ for more
information). Other language features like `async/await <https://blog.getexponent.com/react-native-meets-async-functions-3e6f81111173#.4c2517o5m>`_
are not yet available in most engines and so they need to be compiled
down into JavaScript code that will run on your phone's JavaScript engine,
JavaScript Core.

The second purpose is to serve assets. When you include an image in your
app, you will use syntax like ``<Image source={require('./assets/example.png')} />``,
unless you have already cached that asset you will see a request in the XDE logs
like: ``<START> processing asset request my-proejct/assets/example@3x.png``.
Notice that it serves up the correct asset for the your screen DPI, assuming
that it exists.

Publishing/Deploying an Exponent app in Production
""""""""""""""""""""""""""""""""""""""""""""""""""

When you Publish an Exponent app, we compile it into a JavaScript bundle with production flags enabled (minify, disable runtime development checks) and upload that bundle, along with any assets that it requires (see :ref:`Assets <all-about-assets>`) to CloudFront. We also upload your :ref:`Manifest <exponent-manifest>` (including most of your ``exp.json`` configuration) to our server.

When publishing is complete, we'll give you a URL to your app which you can send to anybody who has the Exponent client.

.. epigraph::
  **Note:** Publishing an Exponent app does not make it publicly searchable or discoverable anywhere. It is up to you to share the link.

As soon as the publish is complete, the new version of your code is available to all your existing users. They'll get the updated version next time they open the app or refresh it, provided that they have a version of the Exponent client that supports the ``sdkVersion`` specified in your ``exp.json``.

.. epigraph::
  **Note:** To package your app for deployment on the Apple App Store or Google Play Store, see :ref:`Building Standalone Apps<building-standalone-apps>`. Each time you update the SDK version you will need to rebuild your binary.

SDK Versions
""""""""""""

The ``sdkVersion`` of an Exponent app indicates what version of the compiled
ObjC/Java/C layer of Exponent to use. Each ``sdkVersion`` roughly corresponds
to a release of React Native plus the Exponent libraries in the SDK section of
these docs.

The Exponent client app supports many versions of the Exponent SDK, but an app
can only use one at a time. This allows you to publish your app today and still
have it work a year from now without any changes, even if we have completely
revamped or removed an API your app depends on in a new version. This is
possible because your app will always be running against the same compiled code
as the day that you published it.

If you publish an update to your app with a new ``sdkVersion``, if a user has yet
to update to the latest Exponent client then they will still be able to use
the previous ``sdkVersion``.

.. epigraph::
  **Note:** It's likely that eventually we will formulate a policy for how long we want to keep around sdkVersions and begin pruning very old versions of the sdk from the client, but until we do that, everything will remain backwards compatible.

Opening a deployed Exponent app
"""""""""""""""""""""""""""""""

.. image:: img/fetch-app-production.png
  :width: 500

The process is essentially the same as opening an Exponent app in development, only now
we hit an Exponent server to get the manifest, and manifest points us to CloudFront to retrieve your app's JavaScript.

Opening Exponent Apps Offline
"""""""""""""""""""""""""""""

The Exponent client will automatically cache the most recent version of every app it
has opened. When you try to open an Exponent app, it will always try and fetch the latest
version, but if that fails for whatever reason (including being totally offline) then it
will load the most recent cached version.

If you build a standalone app with Exponent, that standalone binary will also ship
with a "pre-cached" version of your JavaScript so that it can cold launch the very
first time with no internet. Continue reading for more information about standalone
apps.

Standalone Apps
"""""""""""""""

You can also package your Exponent app into a standalone binary for submission to
the Apple iTunes Store or Google Play.

Under the hood, it's a modified version of the Exponent client which is designed only to load a single URL (the one for your app) and which will never show the Exponent home screen or brand. For more information, see :ref:`Building Standalone Apps <building-standalone-apps>`.
