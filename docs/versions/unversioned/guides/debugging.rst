*********
Debugging
*********

Device vs Emulator
==================

On Android, the Genymotion emulator is much faster than debugging on a real
device or via the standard emulator. To install:

- Install VirtualBox platform package AND VirtualBox Extension Pack from https://www.virtualbox.org/wiki/Downloads
- Install Genymotion: https://www.genymotion.com/ (You'll need to register for a free account)

Bonus

- Install `Frappe <https://github.com/niftylettuce/frappe>`_ to quickly reload
JS with a keyboard shortcut.

Debugging Javascript
====================

The easiest way uses the Chrome debugger tools. Connect your device, and
verify by typing ``adb devices`` to make sure your device is listed.

Then, if you are debugging on a localhost URL, you'll need to forward the
XDE ports. If you are using a LAN URL, you may not need the following commands.

- ``adb reverse tcp:19000 tcp:19000``
- ``adb reverse tcp:19001 tcp:19001``

Most likely these are the correct numbers, but to make sure, the first one is
the port number in your ``exp://localhost:1900x URL``. The second one can be
found from packager, in a message that says ``Running packager on port 19001``

Then, pop open the menu by shaking your device, and clicking on the
``Debug JS Remotely`` entry. This should open up a chrome tab with the URL
``http://localhost:19001/debugger-ui``. From there, you can set breakpoints
and interact with the javascript shell.

NOTE: Debugging async calls is flaky. Chrome doesn't handle the source mapping
properly yet, so if you want to make sure you're breaking in the right place,
you should use the ``debugger`` call when interacting with locals.

Debugging HTTP
==============

To debug HTTP calls properly, you should use a proxy. Candidates include:

- Charles Proxy (Paid): https://www.charlesproxy.com/documentation/configuration/browser-and-system-configuration/
- mitmproxy: https://medium.com/@rotxed/how-to-debug-http-s-traffic-on-android-7fbe5d2a34#.hnhanhyoz
- Fiddler: http://www.telerik.com/fiddler

On android, there is a helpful app `Proxy Settings <https://play.google.com/store/apps/details?id=com.lechucksoftware.proxy.proxysettings>`_
to help switch between debug and non-debug mode. Unfortunately it doesn't
work with Android M yet.

There is `future work <https://github.com/facebook/react-native/issues/934>`_
to get network requests showing up in Chrome DevTools.


Hot Reloading and Live Reloading
================================
`Hot Module Reloading <http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html>`_
is a quick way to reload changes without losing your state in the screen or
history stack. To enable, just shake your device and tap the "Enable Hot
Reloading" item. Whereas Live Reload will reload the entire JS context, Hot
Module Reloading will make your debug cycles even faster. However, make sure
you don't have both options turned on, as that is unsupported behavior.
