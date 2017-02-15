*****
Asset
*****

This module provides an interface to Exponent's asset system. An asset is any
file that lives alongside the source code of your app that the app needs at
runtime. Examples include images, fonts and sounds. Exponent's asset system
integrates with React Native's, so that you can refer to files with
``require('path/to/file')``. This is how you refer to static image files in
React Native for use in an ``Image`` component, for example. Check out React
Native's `documentation on static image resources
<https://facebook.github.io/react-native/docs/images.html#static-image-resources>`_
for more information. This method of referring to static image resources works
out of the box with Exponent.

.. py:class:: Exponent.Asset

   This class represents an asset in your app. It gives metadata about the asset
   (such as its name and type) and provides facilities to load the asset data.

   .. py:attribute:: name

      The name of the asset file without the extension. Also without the part
      from ``@`` onward in the filename (used to specify scale factor for
      images).

   .. py:attribute:: type

      The extension of the asset filename

   .. py:attribute:: hash

      The MD5 hash of the asset's data

   .. py:attribute:: uri

      A URI that points to the asset's data on the remote server. When running
      the published version of your app, this refers to the the location on
      Exponent's asset server where Exponent has stored your asset. When running
      the app from XDE during development, this URI points to XDE's server
      running on your computer and the asset is served directly from your
      computer.

   .. py:attribute:: localUri

      If the asset has been downloaded (by calling :any:`downloadAsync()
      <Exponent.Asset.downloadAsync>`), the ``file://`` URI pointing to the
      local file on the device that contains the asset data.

   .. py:attribute:: width

      If the asset is an image, the width of the image data divided by the scale
      factor. The scale factor is the number after ``@`` in the filename, or
      ``1`` if not present.

   .. py:attribute:: height

      If the asset is an image, the height of the image data divided by the scale
      factor. The scale factor is the number after ``@`` in the filename, or
      ``1`` if not present.


   .. py:method:: downloadAsync

      Downloads the asset data to a local file in the device's cache directory.
      Once the returned promise is fulfilled without error, the :any:`localUri
      <Exponent.Asset.localUri>` field of this asset points to a local file
      containing the asset data. The asset is only downloaded if an up-to-date
      local file for the asset isn't already present due to an earlier download.

.. function:: Exponent.Asset.fromModule(module)

   Returns the :py:class:`Exponent.Asset` instance representing an asset given its
   module

   :param number module:
      The value of ``require('path/to/file')`` for the asset

   :returns:
      The :py:class:`Exponent.Asset` instance for the asset

   :example:
      .. code-block:: javascript

        const imageURI = Exponent.Asset.fromModule(require('./images/hello.jpg')).uri;

      On running this piece of code, ``imageURI`` gives the remote URI that the
      contents of ``images/hello.jpg`` can be read from. The path is resolved
      relative to the source file that this code is evaluated in.
