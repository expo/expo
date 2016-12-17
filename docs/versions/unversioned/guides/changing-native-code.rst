.. _changing-native-code:

********************
Changing Native Code
********************

Unlike raw React Native apps, Exponent apps are written in pure JS and never "drop down" to the
native iOS or Android layer. This is core to the Exponent philosophy and it's part of what makes
Exponent fast and powerful to use.

However, there are some cases where advanced developers need capabilities outside of the core
Exponent SDK, and really need to make changes at the native level. In this case, Exponent allows
you to ``detach`` your pure-JS project from the Exponent iOS/Android clients, providing you
with native projects that can be opened and built with XCode and Android Studio.

**You don't need to do this if your main goal is to distribute your app in the iTunes Store or
Google Play.** Exponent can :ref:`build binaries for you<building-standalone-apps>` in that case. You should only ``detach`` if you
need to make native code changes not available in the Exponent SDK.

.. epigraph::
   **Warning:** We discourage most of our developers from taking this route, as we believe almost
   everything you need to do is better accomplished in a cross-platform way with JS.

   Writing in JS enables you to best take advantage of over-the-air code deployment and benefit from
   ongoing updates and support from Exponent. You should only do this if you have a particular
   demand from native code which Exponent won't do a good job supporting, such as (for example)
   specialized CPU-intensive video processing that must happen locally on the device.

.. epigraph::
   **Note:** ``detach`` is currently an alpha feature and you may run into issues. Proceed at your
   own risk and please reach out to us with any feedback or issues you encounter.

How it works
============

After you ``detach``, all your JS files will stay the same, but we'll additionally create ``ios`` and
``android`` directories in your project folder. These will contain XCode and Android Studio projects
respectively, and they'll have dependencies on React Native and on Exponent's core SDK.

You'll still be able to develop and test your project from XDE, and you'll still be able to publish
your Exponent JS code the same way. However, if you add native dependencies that aren't included
in Exponent, other users won't be able to run those features of your app with the Exponent browser.
You'll need to distribute the native project yourself.
   
1. Install exp
""""""""""""""
If you don't have it, run ``npm install -g exp`` to get our command line library.

If you haven't used ``exp`` before, the first thing you'll need to do is log in
with your Exponent account using ``exp login``.

2. Detach
"""""""""
From your project directory, run ``exp detach``. This will download the required dependencies and
build native projects under the ``ios`` and ``android`` directories.

3. Rerun the project in XDE or exp
""""""""""""""""""""""""""""""""""
Open the project in XDE. If you were already running this project in XDE, press Restart.

If you prefer ``exp``, run ``exp start`` from the project directory.

3. (iOS only) Configure, build and run
""""""""""""""""""""""""""""""""""""""
To configure the XCode project, make sure you have `CocoaPods <https://cocoapods.org>`_, then
run ``pod install`` from your project's ``ios`` directory.

You can now open your project's ``xcworkspace`` file in XCode, build and run the project
on an iOS device or Simulator.

Once the iOS project is running, it should automatically request your development url from XDE
or exp. You can develop your project normally from here.

4. (Android only) TODO: document me
"""""""""""""""""""""""""""""""""""
help computer

5. Make native changes
""""""""""""""""""""""
You can do whatever you want in the XCode and Android Studio projects.

To add third-party native modules for React Native, non-exponent-specific instructions such as
``react-native link`` should be supported.

6. Distribute your app
""""""""""""""""""""""
Publishing your JS from XDE/exp will still work. People who don't have your native code may
encounter crashes if they try to use features that depend on your native changes.

If you decide to distribute your app as an ``ipa`` or ``apk``, it will automatically hit
your app's published URL instead of your development XDE url. You can examine this configuration
in the contents of ``EXShell.plist`` (iOS) or ``TODO`` (Android).
