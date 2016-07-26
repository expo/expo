*********
Debugging
*********

Using a Simulator / Emulator
=============================

There is no substitute to testing the performance and feel of your app on an actual device, but when it comes to debugging you might have an easier time using an emulator/simulator.

Apple refers to their emulator as a "Simulator" and Google refers to theirs as an "Emulator" -- I have no idea why this is the case, but this is why you will see these two terms.

iOS
^^^

For iOS the Simulator built into Xcode works great, you can install Xcode on the `Mac App Store <https://itunes.apple.com/us/app/xcode/id497799835?mt=12>`_ if you haven't already.

Android
^^^^^^^

On Android we recommend the Genymotion emulator over the standard emulator -- we have found it to be more feature complete, faster and easier to use.

- `Install VirtualBox platform package AND VirtualBox Extension Pack <https://www.virtualbox.org/wiki/Downloads>`_
- `Install Genymotion <https://www.genymotion.com/>`_: the "Basic" version is free version and available under the "Individual" plan section (next to Enterprise).
- *Optional*: `Install Frappe <https://github.com/niftylettuce/frappe>`_ to quickly reload JS on your device or emulator with a global keyboard shortcut.

Debugging Javascript
====================

The easiest way uses the Chrome debugger tools. Connect your device, and verify by typing ``adb devices`` to make sure your device is listed.

Then, if you are debugging on a localhost URL, you'll need to forward the XDE ports. This happens automatically when you open a project in XDE, but if you your device wasn't plugged in at the time or it has been disconnected and reconnected since, you may not need the following commands.

- ``adb reverse tcp:19000 tcp:19000``
- ``adb reverse tcp:19001 tcp:19001``

Most likely these are the correct numbers, but to make sure, the first one is the port number in your ``exp://localhost:1900x URL``. The second one can be found from packager, in a message that says ``Running packager on port 19001``

Next, pop open the menu by shaking your device and clicking on the ``Debug JS Remotely`` entry. This should open up a Chrome tab with the URL ``http://localhost:19001/debugger-ui``. From there, you can set breakpoints and interact through the JavaScript console.

NOTE: Debugging async calls isn't 100% reliable. React Native doesn't play well with Chrome's source mapping in every case yet, source mapping properly yet, so if you want to make sure you're breaking in the right place, you should use the ``debugger`` call in your code when interacting with locals.

Debugging HTTP
==============

To debug your app's HTTP requests you should use a proxy. The following options will all work:

- Charles Proxy (Paid, recommended): https://www.charlesproxy.com/documentation/configuration/browser-and-system-configuration/
- mitmproxy: https://medium.com/@rotxed/how-to-debug-http-s-traffic-on-android-7fbe5d2a34#.hnhanhyoz
- Fiddler: http://www.telerik.com/fiddler

On Android, the `Proxy Settings <https://play.google.com/store/apps/details?id=com.lechucksoftware.proxy.proxysettings>`_ app is helpful for switch between debug and non-debug mode. Unfortunately it doesn't work with Android M yet.

There is `future work <https://github.com/facebook/react-native/issues/934>`_ to get network requests showing up in Chrome DevTools.


Hot Reloading and Live Reloading
================================
`Hot Module Reloading <http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html>`_
is a quick way to reload changes without losing your state in the screen or
navigation stack. To enable, just shake your device and tap the "Enable Hot
Reloading" item. Whereas Live Reload will reload the entire JS context, Hot
Module Reloading will make your debug cycles even faster. However, make sure
you don't have both options turned on, as that is unsupported behavior.
