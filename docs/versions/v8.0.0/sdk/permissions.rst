.. _permissions:

***********
Permissions
***********

When it comes to adding functionality that can access potentially sensitive
information on a user's device, such as their location, or possibly send them
possibly unwanted push notifications, you will need to ask the user for their
permission first. Unless you've already asked their permission, then no need.
And so we have the ``Permissions`` module.

.. function:: Exponent.Permissions.getAsync(type)

   Determines whether your app has already been granted access to the provided
   permission type.

   :param string type:
      The name of the permission.

   :returns:
      Returns a ``Promise`` that is resolved 

      If the user cancelled the image picking, returns ``{ cancelled: true }``.

      Otherwise, returns ``{ cancelled: false, uri, width, height }`` where
      ``uri`` is a URI to the local image file (useable in a react-native
      ``Image`` tag) and ``width, height`` specify the dimensions of the image.

.. function:: Exponent.ImagePicker.launchCameraAsync(options)

   Display the system UI for taking a photo with the camera.

   :param object options:
      A map of options:

      * **allowsEditing** (*boolean*) -- Whether to show a UI to edit the image
        after it is picked. On Android the user can crop and rotate the image
        and on iOS simply crop it. Defaults to ``false``.

      * **aspect** (*array*) -- An array with two entries ``[x, y]`` specifying the
        aspect ratio to maintain if the user is allowed to edit the image (by
        passing ``allowsEditing: true``). This is only applicable
        on Android, since on iOS the crop rectangle is always a square.

   :returns:
      If the user cancelled taking a photo, returns ``{ cancelled: true }``.

      Otherwise, returns ``{ cancelled: false, uri, width, height }`` where
      ``uri`` is a URI to the local image file (useable in a React Native
      ``Image`` tag) and ``width, height`` specify the dimensions of the image.

