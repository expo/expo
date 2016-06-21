**********************
Logging
**********************

Writing to the logs in an Exponent app works just like in the browser: use ``console.log``, ``console.warn`` and ``console.error``.
Note: we don't currently support ``console.table`` outside of remote debugging mode.

View logs for an iOS simulator
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Option 1: Use GUI log
""""""""""""""""""""""

* In simulator, press ``⌘ + /``, *or* go to ``Debug -> Open System Log`` -- both of these open a log window that displays all of the logs from your device, including the logs from your Exponent app.

Option 2: Open it in terminal
""""""""""""""""""""""""""""""

* Run ``instruments -s devices``
* Find the device / OS version that the simulator you are using, eg: ``iPhone 6s (9.2) [5083E2F9-29B4-421C-BDB5-893952F2B780]``
* The part in the brackets at the end is the device code, so you can now do this: ``tail -f ~/Library/Logs/CoreSimulator/DEVICE_CODE/system.log``, eg: ``tail -f ~/Library/Logs/CoreSimulator/5083E2F9-29B4-421C-BDB5-893952F2B780/system.log``

View logs for your iPhone
^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``brew install libimobiledevice``
* Plug your phone in
* ``idevicepair pair``
* Press accept on your device
* Run ``idevicesyslog``

View logs from Android device or emulator
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* Ensure Android SDK is installed
* Ensure that `USB debugging is enabled on your device <https://developer.android.com/studio/run/device.html#device-developer-options>`_ (not necessary for emulator).
* Run ``adb logcat``
