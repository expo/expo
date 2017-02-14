*****
Audio
*****

Provides basic sample playback.

We designed the Audio API to be as non-intrusive as possible, so audio will automatically stop
if other audio starts playing on the device, if the device is locked, if the app / experience is
backgrounded, or if headphones / bluetooth audio devices are disconnected.

See the "playlist" example app @exponent/playlist for an example implementation of all of this
functionality.

Enabling Exponent Audio
""""""""""""""""""""""""""""

Audio is disabled by default, so your app must enable it explicitly to play sounds.

.. function:: Exponent.Audio.setIsEnabled(value)

   :param boolean value:
      ``true`` enables Exponent Audio, and ``false`` disables it.

   :returns:
      A ``Promise`` that will reject if audio playback could not be enabled for the device.

Playing sounds
""""""""""""""""""""""""""""

.. py:class:: Exponent.Audio.Sound

   This class represents a sound corresponding to an Asset or URL.

   :param source:
      The source of the audio data to display. The following forms are supported:

         - A string with a network URL pointing to an audio file on the web.
         - ``require('path/to/file')`` for an audio file asset in the source code directory.
         - An Exponent Asset object for an audio file asset in the source code directory.

      The `iOS developer documentation
      <https://developer.apple.com/library/ios/documentation/Miscellaneous/Conceptual/iPhoneOSTechOverview/MediaLayer/MediaLayer.html>`_
      lists the audio formats supported on iOS.

      The `Android developer documentation
      <https://developer.android.com/guide/appendix/media-formats.html#formats-table>`_
      lists the audio formats supported on Android.

   .. py:method:: loadAsync

      Loads the ``Sound`` into memory and prepares it for playing.

   .. py:method:: unload

      Unloads the ``Sound``. ``loadAsync`` must be called again in order to be able to play the ``Sound``.

   .. py:method:: isLoaded

      :returns:
        A ``boolean`` that is true just if the ``Sound`` is loaded.

   .. py:method:: getDurationMillis

      :returns:
        The duration of the ``Sound`` in milliseconds. This is available only after the ``Sound`` is loaded.

   .. py:method:: play

      Plays the ``Sound`` and awaits the result.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: pause

      Pauses the ``Sound`` and awaits the result.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: stop

      Stops the ``Sound`` and awaits the result.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: setPosition

      Seeks the position of the ``Sound`` and awaits the result.

      :param number millis:
        The position to seek the ``Sound`` to.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: setVolume

      Sets the volume of the ``Sound`` and awaits the result. This is NOT the system volume,
      and will only affect this ``Sound``. This value defaults to ``1``.

      :param number value:
        A number between ``0`` (silence) and ``1`` (maximum volume).

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: setIsMuted

      Sets the volume of the ``Sound`` and awaits the result. This is independent of the
      volume of the ``Sound`` set in ``setVolume``. This also does not affect the system
      volume, and only pertains to this ``Sound``. This value defaults to ``true``.

      :param boolean value:
        ``true`` mutes the ``Sound``, and ``false`` unmutes it.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: setIsLooping

      Sets the looping value of the ``Sound`` and awaits the result. When ``true``, it will loop
      indefinitely. This value defaults to ``false``.

      :param boolean value:
        ``true`` sets the ``Sound`` to loop indefinitely.

      :returns:
        The ``status`` of the ``Sound`` (see ``getStatus`` for details).

   .. py:method:: getStatus

      Awaits the ``status`` of the ``Sound``.

      :returns:
        The ``status`` of the ``Sound``: a dictionary with the following key-value pairs.

            - ``position_millis`` : the current position of the ``Sound`` in milliseconds.
            - ``is_playing`` : a boolean describing if the ``Sound`` is currently playing.
            - ``is_muted`` : a boolean describing if the ``Sound`` is currently muted.
            - ``is_looping`` : a boolean describing if the ``Sound`` is currently looping.

   .. py:method:: setStatusChangeCallback

      Sets a function to be called at regular intervals with the ``status`` of the Sound. See
      ``getStatus`` for details on ``status``, and see ``setStatusPollingTimeoutMillis`` for
      details on the regularity with which this function is called.

      :param function callback:
        A function taking the parameter ``status`` (a dictionary, described in ``getStatus``)
        and returning ``void``.

   .. py:method:: setStatusPollingTimeoutMillis

      Sets the interval with which the status change callback is called. See
      ``setStatusChangeCallback`` for details on the status change callback. This value defaults
      to 100 milliseconds.

      Note that the status change callback will automatically be called when another call to the
      API for this ``Sound`` completes (such as ``play``, ``pause``, or ``stop``) regardless of
      this value.

      :param number millis:
        The new interval to call the status change callback.

   .. py:method:: setPlaybackFinishedCallback

      Sets a function to be called whenever this ``Sound`` is finished playing to the end. This
      callback is not called when looping is enabled, or when the sound is stopped or paused
      before it finishes playing.

      :param function callback:
        A ``void -> void`` function.
