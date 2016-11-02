.. _building-standalone-apps:

************************
Building Standalone Apps
************************

Not everybody wants to tell their customers or friends to download Exponent to
use their app; You want to be able to have the app on its own from the App Store
and Play Store. We call these "shell apps" or "standalone apps". The purpose of
this guide is to walk you through creating a standalone version of your Exponent
app for iOS and Android.

An Apple Developer account is needed to build the iOS standalone app, but a
Google Play Developer account is not needed to build the Android standalone app.
If you'd like to submit to either app store, you will of course need a developer
account on that store.

.. epigraph::
  **Warning:** Standalone apps are currently in beta! While the Android version has been heavily tested with `li.st <https://li.st/>`_, the iOS version and our automated build pipeline for both are brand new so you may run into some issues. Be sure to reach out to us on Slack or Twitter if you do and we'll put them on our roadmap, much appreciated!

1. Install exp
""""""""""""""

XDE currently doesn't include an option for building a standalone app, so we'll
need ``exp`` for this. Run ``npm install -g exp`` to get it.

If you haven't used ``exp`` before, the first thing you'll need to do is login
with your Exponent account using ``exp login``.

2. Configure exp.json
"""""""""""""""""""""

The following fields are required in your app's ``exp.json``, so open it up and
add any that are missing.

  .. code-block:: javascript

      {
        name: "Playground",
        iconUrl: "https://s3.amazonaws.com/exp-us-standard/rnplay/app-icon.png",
        version: "2.0.0",
        slug: "rnplay",
        sdkVersion: "8.0.0",
        ios: {
          bundleIdentifier: "org.rnplay.exp",
        },
        android: {
          package: "org.rnplay.exp",
        }
      }

  The iOS ``bundleIdentifier`` and Android ``package`` fields use reverse DNS
  notation, but don't have to be related to a domain. In this case I chose
  ``org.rnplay.exp`` because the app's website is rnplay.org and this is the
  Exponent version of the app. Yours might be ``com.yourcompany.appname``.
  
  You're probably not surprised that ``name``, ``iconUrl`` and ``version`` are
  required, but if you haven't used Exponent much you might be confused by
  ``slug`` and ``sdkVersion``. ``slug`` is the url name that your app's
  JavaScript is published to, for example ``exp.host/@notbrent/rnplay``, where
  ``notbrent`` is my username and ``rnplay`` is the slug. The ``sdkVersion``
  tells Exponent what Exponent runtime version to use, which corresponds to a
  React Native version.

There are other options you might want to add to ``exp.json``. We have only
covered what is required. See :ref:`Configuration with exp.json <exp>` for
the full spec.
  
3. Start the build
""""""""""""""""""

- Run ``exp start`` in your app directory to boot up the Exponent packager.
  This is necessary because during the build process your app will be
  republished to ensure it is the latest version.
- Once the app has started, run ``exp build:android`` or ``exp build:ios``.

If you choose to build for Android
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The first time you build the project you will be asked whether you'd like to
upload a keystore or have us handle it for you. If you don't know what a keystore
is, just leave it to us. Otherwise, feel free to upload your own.

.. code-block:: none

  [exp] No currently active or previous builds for this project.

  Would you like to upload a keystore or have us generate one for you?
  If you don't know what this means, let us handle it! :)

    1) Let Exponent handle the process!
    2) I want to upload my own keystore!

If you choose to build for iOS
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The first time you build the project You will be prompted for your Apple ID and
password for your developer account, and your Apple Team ID. This is needed to
manage to manage certificates and provisioning profiles, so we can build and
send off push notifications.

.. code-block:: none

  [exp] No currently active or previous builds for this project.

  We need your Apple ID/password to manage certificates and provisioning
  profiles from your Apple Developer account.

  What's your Apple ID? example@gmail.com
  Password? ******************
  What is your Apple Team ID (you can find that on this page:
  https://developer.apple.com/account/#/membership)? XY1234567

.. epigraph::
  **Note:** We currently don't support Apple's two-factor authentication, so you'll have to temporarily turn off 2FA on your Apple ID account to use exp build. The GitHub issue for 2FA support is `#17 <https://github.com/exponentjs/exp/issues/17>`_.

Next we will ask you if you'd like us to handle your distribution certificate
or use your own. Similar to the Android keystore, if you don't know what a
distribution certificate is, just let us handle it for you.

4. Wait for it to finish building
"""""""""""""""""""""""""""""""""

This will take a few minutes, you can check up on it by running ``exp
build:status``. When it's done, you'll see the url of a ``.apk`` (Android) or
``.ipa`` (iOS) file -- this is your app. Copy and paste it into your browser
address bar to download -- it won't work with ``curl`` or ``wget`` unless you
happen to know the correct incantation to download a gzipped file from S3.
We will fix this.

.. epigraph::
   **Note:** We enable bitcode for iOS, so the ``.ipa`` files for iOS are much
   larger than the eventual App Store download available to your users. For more
   information, see `App Thinning <https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/AppThinning/AppThinning.html>`_.

5. Test it on your device or simulator
""""""""""""""""""""""""""""""""""""""

- You can drag and drop the ``.apk`` into your Android emulator.
  This is the easiest way to test out that the build was successful. But it's
  not the most satisfying.
- **To run it on your Android device**, make sure you have the Android platform tools installed along with ``adb``, then just run ``adb install app-filename.apk`` with your device plugged in.
- **To run it on your iOS device**, you will need to put in a bit more work :( We are working on producing simulator builds to make it easier to test, but for now you will need to use Apple TestFlight. Go to iTunes connect and create a new app and pick your bundle identifier. After that, I recommend using `pilot <https://github.com/fastlane/fastlane/tree/master/pilot>`_ to upload the build and add testers.

6. Submit it to the appropriate store
"""""""""""""""""""""""""""""""""""""

We don't automate this step (yet), but at this point you should be able to follow
the Apple and Google documentation to submit your standalone binary to each
respective store.

.. epigraph::
   **Note:** When submitting to the iTunes Store, you'll be asked whether your app
   uses the advertising identifier (IDFA). Because Exponent depends on Segment
   Analytics, the answer is yes, and you'll need to check a couple boxes on the Apple
   submission form. See `Segment's Guide <https://segment.com/docs/sources/mobile/ios/quickstart/#step-5-submitting-to-the-app-store>`_ for which specific boxes to fill in.

7. Update your app
""""""""""""""""""

When you want to update your app you can simply publish through XDE or ``exp``! As long as you don't change the ``sdkVersion`` version in ``exp.json`` your standalone app will get the new code next time users open the app.
If you want to change the icon or the app name you'll need to resubmit your app to each store.

If you run into problems during this process, we're more than happy to help out!
Join our Slack and let us know if you have any questions.

.. epigraph::
  **Note:** Are you curious how this works? We embed the Exponent runtime into a new app and make it always point to the published URL of your app.

  We mentioned a few of the required properties here, but you're free to configure everything from the push notification icon to the deep-linking url scheme (see :ref:`the guide on exp.json <configuration>` for more information), and we take care of building it for you so you never have to open Xcode or Android Studio.
