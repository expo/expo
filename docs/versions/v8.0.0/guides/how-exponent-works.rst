==================
How Exponent Works
==================

While it's certainly not necessary to know any of this to use Exponent, many
engineers like to know how their tools work. We'll walk through a few key
concepts here. You can also browse the source, fork, hack on and contribute to
the Exponent tooling on `github/@exponentjs <http://github.com/exponentjs>`_.

Opening an app from Exponent in development
"""""""""""""""""""""""""""""""""""""""""""

.. image:: img/fetch-app-from-xde.png
  :width: 100%

There are two user facing pieces here: the Exponent app and the Exponent
development tool (either XDE or exp CLI). We'll just assume XDE here for
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
