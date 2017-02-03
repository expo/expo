.. _push-notifications:

******************
Push Notifications
******************

Push Notifications are an important feature to, as *"growth hackers"* would
say, retain and re-engage users and monetize on their attention, or something.
From my point of view it's just super handy to know when a relevant event
happens in an app so I can jump back into it and read more. Let's look at how
to do this with Exponent. Spoiler alert: it's almost too easy.

.. epigraph::
  **Note:** iOS and Android simulators cannot receive push notifications, to test them out you will need to use a real-life device. Additionally, when calling Permissions.askAsync on the simulator, it will resolve immediately with "undetermined" as the status, regardless of whether you choose to allow or not.

There are three main steps to wiring up push notifications: sending a user's
Exponent Push Token to your server, calling Exponent's Push API with the token
when you want to send a notification, and responding to receiving and/or
selecting the notification in your app (for example to jump to a particular
screen that the notification refers to).

1. Save the user's Exponent Push Token on your server
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. figure:: img/saving-token.png
  :width: 100%
  :alt: Diagram explaining saving tokens

  In order to send a push notification to somebody, we need to know about their device. Sure, we know our user's account information, but Apple, Google, and Exponent do not understand what devices correspond to "Brent" in your propiertary user account system. Exponent takes care of identifying your device with Apple and Google through the Exponent push token, so all we need to do is send this to your server so you can associate it with the user account and use it in the future for sending push notifications.

.. code-block:: javascript

  import { Permissions, Notifications } from 'exponent';

  const PUSH_ENDPOINT = 'https://your-server.com/users/push-token';

  async function registerForPushNotificationsAsync() {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    let { status } = await Permissions.askAsync(Permissions.REMOTE_NOTIFICATIONS);

    // Stop here if the user did not grant permissions
    if (status !== 'granted') {
      return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExponentPushTokenAsync();

    // POST the token to our backend so we can use it to send pushes from there
    return fetch(PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: {
          value: token,
         },
         user: {
          username: 'Brent',
         },
      }),
    });
  }


2. Call Exponent's Push API with the user's token
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. figure:: img/sending-notification.png
  :width: 100%
  :alt: Diagram explaining sending a push from your server to device

  Push notifications have to come from somewhere, and that somewhere is your server, probably (you could write a command line tool to send them if you wanted, it's all the same). When you're ready to send a push notification, grab the Exponent push token off of the user record and send it over to the Exponent API using a plain old HTTP POST request. We've taken care of wrapping that for you in a few languages:

  - `exponent-server-sdk-ruby <https://github.com/exponent/exponent-server-sdk-ruby>`_
  - `exponent-server-sdk-python <https://github.com/exponent/exponent-server-sdk-python>`_
  - `exponent-server-sdk-node <https://github.com/exponent/exponent-server-sdk-node>`_

  Check out the source if you would like to implement it in another language. For the sake of demonstration, let's look at our `simple-rails-push-server-example <https://github.com/exponent/simple-rails-push-server-example>`_.

.. code-block:: ruby

  require 'exponent-server-sdk'

  class TokensController < ApplicationController
    def create
      # You probably actually want to associate this with a user,
      # otherwise it's not particularly useful
      @token = Token.where(value: params[:token][:value]).first

      message = ''
      if @token.present?
        message = 'Welcome back!'
      else
        @token = Token.create(token_params)
        message = 'Welcome to Exponent'
      end

      exponent.publish(
        exponentPushToken: @token.value,
        message: message,
        data: {a: 'b'}, # Data is required, pass any arbitrary data to include with the notification
      )

      render json: {success: true}
    end

    private

    def token_params
      params.require(:token).permit(:value)
    end

    def exponent
      @exponent ||= Exponent::Push::Client.new
    end
  end

3. Handle receiving and/or selecting the notification
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

For Android, this step is entirely optional -- if your notifications are purely
informational and you have no desire to handle them when they are received or
selected, you're already done. Notifications will appear in the system
notification tray as you've come to expect, and tapping them will open/foreground
the app.

For iOS, you would be wise to handle push notifications that are received while
the app is foregrounded, because otherwise the user will never see them.
Notifications that arrive while the app are foregrounded on iOS do not show up
in the system notification list. A common solution is to just show the notification
manually. For example, if you get a message on Messenger for iOS, have the app
foregrounded, but do not have that conversation open, you will see the
notification slide down from the top of the screen with a custom notification
UI.

Thankfully, handling push notifications is straightforward with Exponent, all
you need to do is add a listener to the ``Notifications`` object.


.. code-block:: javascript

  import React from 'react';
  import Exponent, {
    Notifications,
  } from 'exponent';
  import {
    Text,
    View,
  } from 'react-native';

  import registerForPushNotificationsAsync from 'registerForPushNotificationsAsync';

  class AppContainer extends React.Component {
    state = {
      notification: {},
    };

    componentWillMount() {
      registerForPushNotificationsAsync();

      // Handle notifications that are received or selected while the app
      // is open. If the app was closed and then opened by tapping the
      // notification (rather than just tapping the app icon to open it),
      // this function will fire on the next tick after the app starts
      // with the notification data.
      this._notificationSubscription = Notifications.addListener(this._handleNotification);
    }

    _handleNotification = (notification) => {
      this.setState({notification: notification});
    };

    render() {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Origin: {this.state.notification.origin}</Text>
          <Text>Data: {JSON.stringify(this.state.notification.data)}</Text>
        </View>
      );
    }
  }

  Exponent.registerRootComponent(AppContainer);

Notification handling timing
""""""""""""""""""""""""""""

It's not entirely clear from the above when your app will be able to handle the
notification depending on it's state at the time the notification is received.
For clarification, see the following table:


.. figure:: img/receiving-push.png
  :width: 100%
  :alt: Timing of notifications

HTTP/2 API
""""""""""

Although we provide server-side SDKs in several languages to help you send push notifications, you may want to directly send requests to our HTTP/2 API.

Sending notifications
_____________________

Send a POST request to ``https://exp.host/--/api/v2/push/send`` with the following HTTP headers::

  accept: application/json
  accept-encoding: gzip, deflate
  content-type: application/json

The HTTP request body must be JSON. It may either be a single message object or an array of up to 100 messages. **We recommend using an array when you want to send multiple messages to efficiently minimize the number of requests you need to make to Exponent servers.** This is an example request body that sends two messages:

.. code-block:: json

  [{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "sound": "default",
    "body": "Hello world!"
  }, {
    "to": "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
    "badge": 1,
    "body": "You've got mail"
  }]

Upon success, the HTTP response will be a JSON object whose ``data`` field is an array of push receipts, each of which corresponds to the message at its respective index in the request. Continuing the above example, this is what a successful response body looks like:

.. code-block:: json

  {
    "data": [
      {"status": "ok"},
      {"status": "ok"}
    ]
  }

When there is an error delivering a message, the receipt's status will be "error" and the receipt will contain information about the error, documented below.

.. epigraph::
  **Note:** Even if a receipt says "ok", it doesn't guarantee that the device has received the messsage; "ok" means that we successfully delivered the message to the Android or iOS push notification service. If the recipient device is turned off, for example, the Android or iOS push notification service will try to deliver the message but the device won't necessarily receive it.

If you send a single message that isn't wrapped in an array, the ``data`` field will be the push receipt also not wrapped in an array.

Message format
~~~~~~~~~~~~~~

Each message must be a JSON object with the given fields:

.. code-block:: javascript

  type PushMessage = {
    /**
     * An Exponent push token specifying the recipient of this message.
     */
    to: string,

    /**
     * A JSON object delivered to your app. It may be up to about 4KiB; the total
     * notification payload sent to Apple and Google must be at most 4KiB or else
     * you will get a "Message Too Big" error.
     */
    data?: Object,

    /**
     * The title to display in the notification. On iOS this is displayed only
     * on Apple Watch.
     */
    title?: string,

    /**
     * The message to display in the notification
     */
    body?: string,

    /**
     * A sound to play when the recipient receives this notification. Specify
     * "default" to play the device's default notification sound, or omit this
     * field to play no sound.
     */
    sound?: 'default' | null,

    /**
     * Time to Live: the number of seconds for which the message may be kept
     * around for redelivery if it hasn't been delivered yet. Defaults to 0.
     *
     * On Android, we make a best effort to deliver messages with zero TTL
     * immediately and do not throttle them
     *
     * This field takes precedence over `expiration` when both are specified.
     */
    ttl?: number,

    /**
     * A timestamp since the UNIX epoch specifying when the message expires. This
     * has the same effect as the `ttl` field and is just an absolute timestamp
     * instead of a relative time.
     */
    expiration?: number,

    /**
     * The delivery priority of the message. Specify "default" or omit this field
     * to use the default priority on each platform, which is "normal" on Android
     * and "high" on iOS.
     *
     * On Android, normal-priority messages won't open network connections on
     * sleeping devices and their delivery may be delayed to conserve the battery.
     * High-priority messages are delivered immediately if possible and may wake
     * sleeping devices to open network connections, consuming energy.
     *
     * On iOS, normal-priority messages are sent at a time that takes into account
     * power considerations for the device, and may be grouped and delivered in
     * bursts. They are throttled and may not be delivered by Apple. High-priority
     * messages are sent immediately. Normal priority corresponds to APNs priority
     * level 5 and high priority to 10.
     */
    priority?: 'default' | 'normal' | 'high',

    // iOS-specific fields

    /**
     * Number to display in the badge on the app icon. Specify zero to clear the
     * badge.
     */
    badge?: number,
  }

Response format
~~~~~~~~~~~~~~~

The response is a JSON object with two optional fields, ``data`` and ``errors``. If there is an error with the entire request, ``errors`` will be an array of error objects (usually just one):

.. code-block:: json

  {
    "errors": [{
      "code": "INTERNAL_SERVER_ERROR",
      "message": "An unknown error occurred."
    }]
  }

If there are errors that affect individual messages but not the entire request, the ``errors`` field will be empty and the ``data`` field wil contain push receipts that describe the errors:

.. code-block:: json

  {
    "data": [{
      "status": "error",
      "message": "\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\" is not a registered push notification recipient",
      "details": {
        "error": "DeviceNotRegistered"
      }
    }]
  }

**Important:** in particular, look for an ``details`` object with an ``error`` field. If present, it may be one of three values: ``DeviceNotRegistered``, ``MessageTooBig``, and ``MessageRateExceeded``. You should handle these errors like so:

* ``DeviceNotRegistered``: the device cannot receive push notifications anymore and you should stop sending messages to the given Exponent push token.

* ``MessageTooBig``: the total notification payload was too large. On Android and iOS the total payload must be at most 4096 bytes.

* ``MessageRateExceeded``: you are sending messages too frequently to the given device. Implement exponential backoff and slowly retry sending messages.

If we couldn't deliver the message to the Android or iOS push notification service, the receipt's details may also include service-specific information. This is useful mostly for debugging and reporting possible bugs to us.
