Constants
=========

System information that remains constant throughout the lifetime of your app.

.. attribute:: Exponent.Constants.appOwnership

   Returns ``exponent``, ``standalone``, or ``guest``. If ``exponent``,
   the experience is running inside of the Exponent client. If
   ``standalone``, it is a :ref:`standalone app <building-standalone-apps>`.
   If ``guest``, it has been opened through a link from a standalone app.

.. attribute:: Exponent.Constants.exponentVersion

   The version string of the Exponent client currently running.

.. attribute:: Exponent.Constants.deviceId

   An identifier that is unique to this particular device and installation of
   the Exponent client.

.. attribute:: Exponent.Constants.deviceName

   A human-readable name for the device type.

.. attribute:: Exponent.Constants.deviceYearClass

   The `device year class <https://github.com/facebook/device-year-class>`_ of
   this device.

.. attribute:: Exponent.Constants.isDevice

   ``true`` if the app is running on a device, ``false`` if running in a simulator
   or emulator.


.. attribute:: Exponent.Constants.platform

    .. attribute:: ios

        .. attribute:: platform

           The Apple internal model identifier for this device, e.g. ``iPhone1,1``.
        .. attribute:: model

           The human-readable model name of this device, e.g. ``iPhone 7 Plus``.
        .. attribute:: userInterfaceIdiom

           The user interface idiom of this device, i.e. whether the app is running on an iPhone or an iPad. Current supported values are ``handset`` and ``tablet``. Apple TV and CarPlay will show up as ``unsupported``.

.. attribute:: Exponent.Constants.sessionId

   A string that is unique to the current session of your app. It is different
   across apps and across multiple launches of the same app.

.. attribute:: Exponent.Constants.statusBarHeight

   The default status bar height for the device. Does not factor in changes when
   location tracking is in use or a phone call is active.

.. attribute:: Exponent.Constants.systemFonts

   A list of the system font names available on the current device.

.. attribute:: Exponent.Constants.manifest

   The :ref:`manifest <exponent-manifest>` object for the app.

.. attribute:: Exponent.Constants.linkingUri

   When an app is opened due to a deep link, the prefix of the URI without the
   deep link part. This value depends on ``Exponent.Constants.appOwnership``:
   it may be different if your app is running standalone vs. in the Exponent
   client.
