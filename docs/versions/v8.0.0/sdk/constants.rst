Constants
=========

System information that remains constant throughout the lifetime of your app.

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

..
  .. attribute:: Exponent.Constants.platform

    TODO

    .. attribute:: ios

        TODO

        .. attribute:: platform

        TODO

        .. attribute:: model

        TODO

.. attribute:: Exponent.Constants.sessionId

   A string that is unique to the current session of your app. It is different
   across apps and across multiple launches of the same app.

.. attribute:: Exponent.Constants.manifest

   The :ref:`manifest <exponent-manifest>` object for the app.

.. attribute:: Exponent.Constants.linkingUri

   When an app is opened due to a deep link, the prefix of the initial URI
   without the deep link part. If this prefix is removed from
   ``props.exp.initialUri``, the deep link path remains.

..
  .. attribute:: Exponent.Constants.statusBarHeight

    Height of the top status bar in pixels.

