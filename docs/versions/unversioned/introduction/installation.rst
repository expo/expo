.. _installation:

Installation
============

There are two tools that you need to develop apps with Exponent - a
desktop development tool and a mobile client to open your app.

Desktop Development Tool: XDE
-----------------------------

XDE stands for Exponent Development Environment. It is a standalone
desktop app that includes all dependencies you'll need to get started.

`Download the latest version of XDE for Mac <https://github.com/exponentjs/xde/releases/latest>`_.

*Linux and Windows support is planned but not currently available.*.

Mobile Client: Exponent for iOS and Android
--------------------------------------------

The Exponent client is like a browser for apps built with Exponent. When
you boot up XDE on your project it generates a unique development URL
for you, and you can access that from the Exponent client on iOS or
Android, either on a real device or in a simulator.

On your device
^^^^^^^^^^^^^^

`Download for Android 4.4+ from the Play Store <https://play.google.com/store/apps/details?id=host.exp.exponent>`_ or `for iOS 8+ from the App Store <https://itunes.com/apps/exponent>`_

iOS simulator
^^^^^^^^^^^^^

Install `Xcode through the Apple App Store <https://itunes.apple.com/app/xcode/id497799835>`_. It'll take a while, go have a nap. Next, open up Xcode, go to preferences and click the Components tab, install a simulator from the list `(screenshot). </_static/img/xcode-simulator.png>`_

Android emulator
^^^^^^^^^^^^^^^^

Follow the `Genymotion Installation guide <https://docs.genymotion.com/Content/01_Get_Started/Installation.htm>`_ -- the Individual Basic plan is free and works great with Exponent. Once you've installed Genymotion, create a virtual device - we recommend a Nexus 5, the Android version is up to you. Start up the virtual device when it's ready.

Once the emulator is open and you have a project open in XDE, you can press *Open project in Exponent on Android* in XDE and it will install the Exponent client to the emulator and open up your app inside of it.

Node.js
--------

To get started wtih Exponent you don't necessarily need to have Node.js
installed, but as soon as you start actually building something you'll want to
have it. `Download the latest version of Node.js <https://nodejs.org/en/>`_.
