Versions
===========

Provides information about React Native versions that Exponent supports.

.. function:: xdl.Versions.facebookReactNativeVersionsAsync(options)

   Returns list of Facebook React Native versions that Exponent supports.

   :returns:
      ``Promise<Array<string>>``

.. function:: xdl.Versions.facebookReactNativeVersionToExponentVersionAsync()

   Maps Facebook React Native version to Exponent SDK version.

   :returns:
      Returns ``Promise<string>`` or ``Promise<null>`` if no matching version found.
