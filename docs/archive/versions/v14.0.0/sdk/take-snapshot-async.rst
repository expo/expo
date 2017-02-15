takeSnapshotAsync
=================

Given a view, ``takeSnapshotAsync`` will essentially screenshot that view and
return an image for you. This is very useful for things like signature pads,
where the user draws something and then you want to save an image from it.

.. function:: Exponent.takeSnapshotAsync(view, options)

   Snapshots the given view.

   :param number|ReactElement view:
     The ``ref`` or ``reactTag`` (also known as node handle) for the view to snapshot.

   :param object options:
      A map of options:

      * **format** (*string*) -- ``"png" | "jpg" | "jpeg" | "webm"``
      * **quality** (*number*) -- Number between 0 and 1 where 0 is worst quality and 1 is best.
      * **result** (*string*) -- The type for the resulting image.

        * ``'file'`` -- Return a file uri.
        * ``'base64'`` -- base64 encoded image.
        * ``'data-uri'`` -- base64 encoded image with data-uri prefix.

      * **height** (*number*) -- Height of result in pixels.
      * **width** (*number*) -- Width of result in pixels.


   :returns:
     An image of the format specified in the options parameter.
