.. _installation:

Installation
============

There are two tools that you need to develop apps with Exponent - a
desktop development tool and a mobile client to open your app.

Desktop Development Tool: XDE
-----------------------------

XDE stands for Exponent Development Environment. It is a standalone
desktop app that includes all dependencies you'll need to get started.

Download the latest version of XDE for `macOS <https://xde-updates.exponentjs.com/download/mac>`_, `Windows (64-bit) <https://xde-updates.exponentjs.com/download/win32>`_, or `Linux <https://xde-updates.exponentjs.com/download/linux>`_.

On Linux, open with ``chmod a+x XDE*.AppImage`` and ``./XDE*.AppImage``.

Mobile Client: Exponent for iOS and Android
--------------------------------------------

The Exponent client is like a browser for apps built with Exponent. When
you boot up XDE on your project it generates a unique development URL
for you, and you can access that from the Exponent client on iOS or
Android, either on a real device or in a simulator.

On your device
^^^^^^^^^^^^^^

`Download for Android 4.4+ from the Play Store <https://play.google.com/store/apps/details?id=host.exp.exponent>`_ or `for iOS 8+ from the App Store <https://itunes.com/apps/exponent>`_

Note: you don't need to install the Exponent client on emulators separately. It will be done on the first project deployment.

iOS simulator
^^^^^^^^^^^^^

Install `Xcode through the Apple App Store <https://itunes.apple.com/app/xcode/id497799835>`_. It'll take a while, go have a nap. Next, open up Xcode, go to preferences and click the Components tab, install a simulator from the list `(screenshot). </_static/img/xcode-simulator.png>`_

Once the simulator is open and you have a project open in XDE, you can press *Open on iOS simulator* in XDE and it will install the Exponent client to the emulator and open up your app inside of it.

Android emulator
^^^^^^^^^^^^^^^^

`Download Genymotion <https://www.genymotion.com/fun-zone/>`_ (free version) and follow the `Genymotion installation guide <https://docs.genymotion.com/Content/01_Get_Started/Installation.htm>`_. Once you've installed Genymotion, create a virtual device - we recommend a Nexus 5, the Android version is up to you. Start up the virtual device when it's ready.

Once the emulator is open and you have a project open in XDE, you can press *Open project in Exponent on Android* in XDE and it will install the Exponent client to the emulator and open up your app inside of it.


Node.js
--------

To get started with Exponent you don't necessarily need to have Node.js
installed, but as soon as you start actually building something you'll want to
have it. `Download the latest version of Node.js <https://nodejs.org/en/>`_.

Watchman
--------

Some macOS users encounter issues if they do not have this installed on their machine,
so we recommend that you install Watchman. Watchman watches files and records
when they change, then triggers actions in response to this, and it's used
internally by React Native. `Download and install Watchman <https://facebook.github.io/watchman/docs/install.html>`_
