*****
Audio
*****

Provides basic sample playback.

We designed the Audio API to be as non-intrusive as possible, so audio will automatically stop
if other audio starts playing on the device, if the device is locked, if the app / experience is
backgrounded, or if headphones / bluetooth audio devices are disconnected.

Try the `playlist example app <http://getexponent.com/@exponent/playlist>`_
(source code is `on GitHub <https://github.com/exponent/playlist>`_) to see an
example usage of this API.

Enabling Audio
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

   .. py:method:: Sound

      The constructor for this class

      :param object options:
         A map of options:

         * **source** -- The source of the audio data to display. The following
           forms are supported:

            * A string with a network URL pointing to an audio file on the web.
            * ``require('path/to/file')`` for an audio file asset in the source code directory.
            * An :py:class:`Exponent.Asset` object for an audio file asset.

           The `iOS developer documentation
           <https://developer.apple.com/library/ios/documentation/Miscellaneous/Conceptual/iPhoneOSTechOverview/MediaLayer/MediaLayer.html>`_
           lists the audio formats supported on iOS.

           The `Android developer documentation
           <https://developer.android.com/guide/appendix/media-formats.html#formats-table>`_
           lists the audio formats supported on Android.

      :returns:
         A newly constructed instance of ``Exponent.Audio.Sound``.

      :example:
         .. code-block:: javascript

           const sound = new Exponent.Audio.Sound({
             source: require('./assets/sounds/hello.mp3'),
           });

   .. py:method:: loadAsync

      Loads the sound into memory and prepares it for playing. This must be
      called before calling ``play``.

      :returns:
         A ``Promise`` that is fulfilled when the sound is loaded, or rejects if loading failed.

   .. py:method:: unload

      Unloads the sound. ``loadAsync`` must be called again in order to be able to play the sound.

   .. py:method:: isLoaded

      :returns:
        A ``boolean`` that is true if and only if the sound is loaded.

   .. py:method:: getDurationMillis

      :returns:
        The duration of the sound in milliseconds. This is available only after the sound is loaded.

   .. py:method:: play

      Plays the sound.

      :returns:
         A ``Promise`` that is resolved, once the sound starts playing, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: pause

      Pauses the sound.

      :returns:
         A ``Promise`` that is resolved, once playback is paused, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: stop

      Stops the sound.

      :returns:
         A ``Promise`` that is resolved, once playback is stopped, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: setPosition

      Sets the playback position of the sound.

      :param number millis:
        The position to seek the sound to.

      :returns:
         A ``Promise`` that is resolved, once the seek occurs, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: setVolume

      Sets the volume of the sound. This is NOT the system volume,
      and will only affect this sound. This value defaults to ``1``.

      :param number value:
        A number between ``0`` (silence) and ``1`` (maximum volume).

      :returns:
         A ``Promise`` that is resolved, once the volume is set, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: setIsMuted

      Sets whether the sound is muted. This is independent of the volume of the
      sound set in ``setVolume``. This also does not affect the system volume,
      and only pertains to this sound. This value defaults to ``true``.

      :param boolean value:
        ``true`` mutes the sound, and ``false`` unmutes it.

      :returns:
         A ``Promise`` that is resolved, once the mute state is set, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: setIsLooping

      Sets whether playback of the sound should loop. When ``true``, it will loop
      indefinitely. This value defaults to ``false``.

      :param boolean value:
        ``true`` sets the sound to loop indefinitely.

      :returns:
         A ``Promise`` that is resolved, once the loop state is set, with the
         ``status`` of the sound (see ``getStatus`` for details).

   .. py:method:: getStatus

      Gets the ``status`` of the sound.

      :returns:
         A ``Promise`` that is resolved with the ``status`` of the sound: a
         dictionary with the following key-value pairs.

            - ``position_millis`` : the current position of playback in milliseconds.
            - ``is_playing`` : a boolean describing if the sound is currently playing.
            - ``is_muted`` : a boolean describing if the sound is currently muted.
            - ``is_looping`` : a boolean describing if the sound is currently looping.

   .. py:method:: setStatusChangeCallback

      Sets a function to be called at regular intervals with the ``status`` of the Sound. See
      ``getStatus`` for details on ``status``, and see ``setStatusPollingTimeoutMillis`` for
      details on the regularity with which this function is called.

      :param function callback:
        A function taking a single parameter ``status`` (a dictionary, described
        in ``getStatus``).

   .. py:method:: setStatusPollingTimeoutMillis

      Sets the interval with which the status change callback is called. See
      ``setStatusChangeCallback`` for details on the status change callback. This value defaults
      to 100 milliseconds.

      Note that the status change callback will automatically be called when another call to the
      API for this sound completes (such as ``play``, ``pause``, or ``stop``) regardless of
      this value.

      :param number millis:
        The new interval between calls of the status change callback.

   .. py:method:: setPlaybackFinishedCallback

      Sets a function to be called whenever this sound is finished playing to the end. This
      callback is not called when looping is enabled, or when the sound is stopped or paused
      before it finishes playing.

      :param function callback:
         The callback receives no parameters.
