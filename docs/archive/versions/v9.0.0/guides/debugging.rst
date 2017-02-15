*********
Debugging
*********

Using a Simulator / Emulator
=============================

**There is no substitute to testing the performance and feel of your app on an
actual device**, but when it comes to debugging you might have an easier time
using an emulator/simulator.

Apple refers to their emulator as a "Simulator" and Google refers to theirs as
an "Emulator" -- I have no idea why this is the case, but this is why you will
see these two terms.

iOS
^^^

For iOS the Simulator built into Xcode works great, you can install Xcode on
the `Mac App Store <https://itunes.apple.com/us/app/xcode/id497799835?mt=12>`_
if you haven't already.

Android
^^^^^^^

On Android we recommend the Genymotion emulator over the standard emulator --
we have found it to be more feature complete, faster and easier to use.

- `Install VirtualBox platform package AND VirtualBox Extension Pack <https://www.virtualbox.org/wiki/Downloads>`_
- `Install Genymotion <https://www.genymotion.com/>`_: the "Basic" version is
  free version and available under the "Individual" plan section (next to
  Enterprise).
- *Optional*: `Install Frappe <https://github.com/niftylettuce/frappe>`_ to
  quickly reload JS on your device or emulator with a global keyboard shortcut.

Debugging Javascript
====================

You can debug Exponent apps using the Chrome debugger tools. Rather than
running your app's JavaScript on your phone, it will instead run it inside
of a webworker in Chrome. You can then set breakpoints, inspect variables,
execute code, etc, as you would when debugging a web app.

- To ensure the best debugging experience, first change your host type in XDE
  to ``LAN`` or ``localhost``. If you use ``Tunnel`` with debugging enabled,
  you are likely to experience so much latency that your app is unusable. While
  here, also ensure that ``Development Mode`` is checked.

  .. image:: img/debugging-host.png
    :width: 100%

- If you are using ``LAN``, make sure your device is on the same wifi network
  as your development machine. This may not work on some public networks.
  ``localhost`` will not work for iOS unless you are in the simulator, and it
  only work on Android if your device is connected to your machine via usb.
- Open the app on your device, then shake the device a little bit to reveal the
  developer menu. Tap on ``Debug JS Remotely``. This should open up a Chrome
  tab with the URL ``http://localhost:19001/debugger-ui``. From there, you can
  set breakpoints and interact through the JavaScript console. Shake the
  device and stop Chrome debugging when you're done.
- Line numbers for ``console.log`` statements don't work by default when using
  Chrome debugging. To get correct line numbers open up the Chrome Dev Tools
  settings, go to the "Blackboxing" tab, make sure that "Blackbox content
  scripts" is checked, and add ``exponent/src/Logs.js`` as a pattern with
  "Blackbox" selected.


Troubleshooting localhost debugging
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When you open a project in XDE and when you press ``Open on Android``, XDE will
automatically tell your device to forward ``localhost:19000`` and ``19001`` to
your development machine, as long as your device is plugged in or emulator is
running. If you are using ``localhost`` for debugging and it isn't working,
close the app and open it up again using ``Open on Android``. Alternatively,
you can manually forward the ports using the following command if you have the
Android developer tools installed: ``adb reverse tcp:19000 tcp:19000`` - ``adb reverse tcp:19001 tcp:19001``

Source maps and async functions
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Source maps and async functions aren't 100% reliable. React Native doesn't play
well with Chrome's source mapping in every case, so if you want to make sure
you're breakpointing in the correct place, you should use the ``debugger`` call
directly from your code.

Debugging HTTP
==============

To debug your app's HTTP requests you should use a proxy. The following options will all work:

- `Charles Proxy <https://www.charlesproxy.com/documentation/configuration/browser-and-system-configuration/>`_ ($50 USD, our preferred tool)
- `mitmproxy <https://medium.com/@rotxed/how-to-debug-http-s-traffic-on-android-7fbe5d2a34#.hnhanhyoz>`_
- `Fiddler <http://www.telerik.com/fiddler>`_

On Android, the `Proxy Settings <https://play.google.com/store/apps/details?id=com.lechucksoftware.proxy.proxysettings>`_
app is helpful for switch between debug and non-debug mode. Unfortunately it
doesn't work with Android M yet.

There is `future work <https://github.com/facebook/react-native/issues/934>`_
to get network requests showing up in Chrome DevTools.


Hot Reloading and Live Reloading
================================
`Hot Module Reloading <http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html>`_
is a quick way to reload changes without losing your state in the screen or
navigation stack. To enable, just shake your device and tap the "Enable Hot
Reloading" item. Whereas Live Reload will reload the entire JS context, Hot
Module Reloading will make your debug cycles even faster. However, make sure
you don't have both options turned on, as that is unsupported behavior.
