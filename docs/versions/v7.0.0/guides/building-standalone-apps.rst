************************
Building Standalone Apps
************************

Don't apologize, we get it, not everyone wants to tell their customers or
friends to download Exponent to use their app. You want to be able
to have the app stand alone on the App Store and Play Store. We call these
"shell apps" or "standalone apps". What this means is that we embed the
Exponent runtime into a new app and make it always point to the URL of your
Exponent app. You're free to configure everything from the home screen icon
to the url scheme for the app (to allow for deep linking), and we take care
of building it for you so you never have to open Xcode or Android Studio.

.. epigraph::
  **Note:** Standalone app support is currently in alpha! While it has been heavily tested on Android with `li.st <https://li.st/>`_, the iOS version and our build pipeline is brand new so you may run into some issues. Be sure to reach out to us on Slack or Twitter if you do and we'll fix them up right away and send you an Exponent t-shirt.

