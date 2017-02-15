Amplitude
========

Provides access to https://amplitude.com/ mobile analytics. Wraps Amplitude's `iOS
<https://github.com/amplitude/Amplitude-iOS>`_ and `Android
<https://github.com/amplitude/Amplitude-Android>`_ SDKs.

Note: Session tracking may not work correctly when running Experiences in the main Exponent app. It will work correctly if you create a standalone app.

.. function:: Exponent.Amplitude.initialize(apiKey)

   Initializes Amplitude with your Amplitude API key. Find your API key using `these instructions
   <https://amplitude.zendesk.com/hc/en-us/articles/206728448-Where-can-I-find-my-app-s-API-Key-or-Secret-Key->`_.

   :param string apiKey:
      Your Amplitude application's API key.

.. function:: Exponent.Amplitude.setUserId(userId)

   Assign a user ID to the current user. If you don't have a system for user IDs you don't need to call this. See https://amplitude.zendesk.com/hc/en-us/articles/206404628-Step-2-Assign-User-IDs-and-Identify-your-Users.

   :param string userId:
      User ID for the current user.

.. function:: Exponent.Amplitude.setUserProperties(userProperties)

   Set properties for the current user. See https://amplitude.zendesk.com/hc/en-us/articles/207108327-Step-4-Set-User-Properties-and-Event-Properties.

   :param object userProperties:
      A map of custom properties.

.. function:: Exponent.Amplitude.clearUserProperties()

   Clear properties set by :func:`Exponent.Amplitude.setUserProperties`.

.. function:: Exponent.Amplitude.logEvent(eventName)

   Log an event to Amplitude. https://amplitude.zendesk.com/hc/en-us/articles/206404698-Step-3-Track-Events-and-Understand-the-Actions-Users-Take has information about what kind of events to track.

   :param string eventName:
      The event name.

.. function:: Exponent.Amplitude.logEventWithProperties(eventName, properties)

   Log an event to Amplitude with custom properties. https://amplitude.zendesk.com/hc/en-us/articles/206404698-Step-3-Track-Events-and-Understand-the-Actions-Users-Take has information about what kind of events to track.

   :param string eventName:
      The event name.

   :param object properties:
      A map of custom properties.

.. function:: Exponent.Amplitude.setGroup(groupType, groupNames)

   Add the current user to a group. See https://github.com/amplitude/Amplitude-iOS#setting-groups and https://github.com/amplitude/Amplitude-Android#setting-groups.

   :param string groupType:
      The group name, e.g. "sports".

   :param object groupNames:
      An array of group names, e.g. ["tennis", "soccer"]. Note: the iOS and Android Amplitude SDKs allow you to use a string or an array of strings. We only support an array of strings. Just use an array with one element if you only want one group name.
