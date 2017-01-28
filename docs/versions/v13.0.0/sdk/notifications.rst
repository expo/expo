Notifications
=============

Provides access to remote notifications (also known as push notifications) and
local notifications (scheduling and immediate) related functions.

Subscribing to Notifications
""""""""""""""""""""""""""""

.. function:: Exponent.Notifications.addListener(listener)

   :param function listener:
      A callback that is invoked when a remote or local notification is
      received or selected, with a `Notification <#Notification>`_ object.

   :returns:
      An `EventSubscription <EventSubscription>`_ object that you can call
      `remove()` on when you would like to unsubscribe the listener.

Related types
'''''''''''''

.. js:data:: EventSubscription

  Returned from ``addListener``.

  * **remove()** (*function*) -- Unsubscribe the listener from future notifications.

.. js:data:: Notification

  An object that is passed into each event listener when a notification is received:

  * **origin** (*string*) -- Either ``selected`` or ``received``. ``selected``
    if the notification was tapped on by the user, ``received`` if the
    notification was received while the user was in the app.

  * **data** (*object*) -- Any data that has been attached with the notification.

  * **remote** (*boolean*) -- ``true`` if the notification is a push notification, ``false``
    if it is a local notification.

Remote (Push) Notifications
"""""""""""""""""""""""""""

.. function:: Exponent.Notifications.getExponentPushTokenAsync()

   :returns:
      Returns a Promise that resolves to a token string. This token can be provided
      to the Exponent notifications backend to send a push notification to this
      device. :ref:`Read more in the Push Notifications guide <push-notifications>`.

Local Notifications
"""""""""""""""""""

.. function:: Exponent.Notifications.presentLocalNotificationAsync(localNotification)

   Trigger a local notification immediately.

   :param object localNotification:
     An object with the properties described in `LocalNotification <#LocalNotification>`_.

   :returns:
     A Promise that resolves to a unique notification id.

.. function:: Exponent.Notifications.scheduleLocalNotificationAsync(localNotification, schedulingOptions)

   Schedule a local notification to fire at some specific time in the future or at a given interval.

   :param object localNotification: An object with the properties described in `LocalNotification <#LocalNotification>`_.

   :param object schedulingOptions: An object that describes when the notification should fire.

    * **time** (*date* or *number*) -- A Date object representing when to fire the notification
      or a number in Unix epoch time. Example: ``(new Date()).getTime() + 1000`` is one second
      from now.

    * **repeat** (*optional*) (*string*) --  ``'minute'``, ``'hour'``,
      ``'day'``, ``'week'``, ``'month'``, or ``'year'``.

   :returns:
     A Promise that resolves to a unique notification id.

.. function:: Exponent.Notifications.dismissNotificationAsync(localNotificationId)

   *Android only*. Dismisses the notification with the given id.

   :param number localNotificationId:
     A unique id assigned to the notification, returned from
     ``scheduleLocalNotificationAsync`` or ``presentLocalNotificationAsync``.

.. function:: Exponent.Notifications.dismissAllNotificationsAsync()

   *Android only*. Clears any notificatons that have been presented by the app.

.. function:: Exponent.Notifications.cancelScheduledNotificationAsync(localNotificationId)

   Cancels the scheduled notification corresponding to the given id.

   :param number localNotificationId:
     A unique id assigned to the notification, returned from
     ``scheduleLocalNotificationAsync`` or ``presentLocalNotificationAsync``.

.. function:: Exponent.Notifications.cancelAllScheduledNotificationsAsync()

   Cancel all scheduled notifications.

Related types
'''''''''''''

.. js:data:: LocalNotification

  An object used to describe the local notification that you would like to present or schedule.

  * **title** (*string*) -- title text of the notification.

  * **body** (*string*) -- body text of the notification.

  * **data** (*optional*) (*object*) -- any data that has been attached with the notification.

  * **ios** (*optional*) (*object*) -- notification configuration specific to iOS.

    * **sound** (*optional*) (*boolean*) -- if ``true``, play a sound. Default: ``false``.

  * **android** (*optional*) (*object*) -- notification configuration specific to Android.

    * **sound** (*optional*) (*boolean*) -- if ``true``, play a sound. Default: ``false``.

    * **icon** (*optional*) (*string*) -- URL of icon to display in notification drawer.

    * **color** (*optional*) (*string*) -- color of the notification icon in notification drawer.

    * **priority** (*optional*) (*min | low | high | max*) -- android may present notifications acccording to the priority, for example a ``high`` priority notification will likely to be shown as a heads-up notification.

    * **sticky** (*optional*) (*boolean*) -- if ``true``, the notification will be sticky and not dissmissable by user. The notification must be programmatically dismissed. Default: ``false``.

    * **vibrate** (*optional*) (*boolean* or *array*) -- if ``true``, vibrate the device. An array can be supplied to specify the vibration pattern, e.g. - ``[ 0, 500 ]``.

    * **link** (*optional*) (*string*) -- external link to open when notification is selected.
