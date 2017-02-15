Segment
========

Provides access to https://segment.com/ mobile analytics. Wraps Segment's `iOS
<https://segment.com/docs/sources/mobile/ios/>`_ and `Android
<https://segment.com/docs/sources/mobile/android/>`_ sources.

Note: Session tracking may not work correctly when running Experiences in the main Exponent app. It will work correctly if you create a standalone app.

.. function:: Exponent.Segment.initializeIOS(writeKey)

   Segment requires separate write keys for iOS and Android. Call this with the write key for your iOS source in Segment.

   :param string writeKey:
      Write key for iOS source.

.. function:: Exponent.Segment.initializeAndroid(writeKey)

   Segment requires separate write keys for iOS and Android. Call this with the write key for your Android source in Segment.

   :param string writeKey:
      Write key for Android source.

.. function:: Exponent.Segment.identify(userId)

   Associates the current user with a user ID. Call this after calling :func:`Exponent.Segment.initializeIOS` and :func:`Exponent.Segment.initializeAndroid` but before other segment calls. See https://segment.com/docs/spec/identify/.

   :param string writeKey:
      User ID for the current user.

.. function:: Exponent.Segment.identifyWithTraits(userId, traits)

   Associates the current user with a user ID and some metadata. Call this after calling :func:`Exponent.Segment.initializeIOS` and :func:`Exponent.Segment.initializeAndroid` but before other segment calls. See https://segment.com/docs/spec/identify/.

   :param string writeKey:
      User ID for the current user.

   :param object traits
      A map of custom properties.

.. function:: Exponent.Segment.track(event)

   Log an event to Segment. See https://segment.com/docs/spec/track/.

   :param string event:
      The event name.

.. function:: Exponent.Segment.trackWithProperties(event, properties)

   Log an event to Segment with custom properties. See https://segment.com/docs/spec/track/.

   :param string event:
      The event name.

   :param object properties:
      A map of custom properties.

.. function:: Exponent.Segment.flush()

   Manually flush the event queue. You shouldn't need to call this in most cases.
