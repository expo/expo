Facebook
==============

Provides Facebook integration for Exponent apps. Exponent exposes a minimal
native API since you can access Facebook's `Graph API
<https://developers.facebook.com/docs/graph-api>`_ directly through HTTP (using
`fetch <https://facebook.github.io/react-native/docs/network.html#fetch>`_, for
example).

Follow `Facebook's developer documentation
<https://developers.facebook.com/docs/apps/register>`_ to register an
application with Facebook's API and get an application ID. For iOS, make sure to
add `host.exp.Exponent` as a 'Bundle ID'. For Android add the key hash
``rRW++LUjmZZ+58EbN5DVhGAnkX4=``. Your app's settings should end up including the
following under "Settings > Basic":

.. image:: img/facebook-app-settings.png
  :width: 95%
  :align: center

You may have to switch the app from 'development mode' to 'public mode' before
other users can log in.

.. function:: Exponent.Facebook.logInWithReadPermissionsAsync(appId, options)

  Prompts the user to log into Facebook and grants your app permission
   to access their Facebook data.

   :param string appId:
      Your Facebook application ID. `Facebook's developer documentation
      <https://developers.facebook.com/docs/apps/register>`_ describes how to
      get one.

   :param object options:
      A map of options:

      * **permissions** (*array*) -- An array specifying the permissions to ask
        for from Facebook for this login. The permissions are strings as
        specified in the `Facebook API documentation
        <https://developers.facebook.com/docs/facebook-login/permissions>`_. The
        default permissions are ``['public_profile', 'email', 'user_friends']``.
      * **behavior** (*string*) -- The type of login prompt to show. Currently
        this is only supported on iOS, and must be one of the following values:

        * ``'web'`` (default) -- Attempts to log in through a modal ``UIWebView``
          pop up.
        * ``'native'`` -- Attempts to log in through the native Facebook app. This
          is only supported for standalone apps.
        * ``'browser'`` -- Attempts to log in through Safari or
          ``SFSafariViewController``. This is only supported for standalone
          apps.
        * ``'system'`` -- Attempts to log in through the Facebook account
          currently signed in through the device Settings. This is only
          supported for standalone apps.

        For the ``'native'``, ``'browser'`` and ``'system'`` options, which are
        only supported on standalone apps, you will have to add a field
        ``facebookScheme`` in your :ref:`exp.json <exp>` with your Facebook login
        redirect URL scheme found `here
        <https://developers.facebook.com/docs/facebook-login/ios>`_ under "4.
        Configure Your info.plist." It should look like ``"fb123456"``.

   :returns:
      If the user or Facebook cancelled the login, returns ``{ type: 'cancel' }``.

      Otherwise, returns ``{ type: 'success', token, expires }``. ``token`` is a
      string giving the access token to use with Facebook HTTP API requests.
      ``expires`` is the time at which this token will expire, as seconds since
      epoch. You can save the access token using, say, ``AsyncStorage``, and
      use it till the expiration time.

   :example:
      .. code-block:: javascript

        async function logIn() {
          const { type, token } = await Exponent.Facebook.logInWithReadPermissionsAsync(
            '<APP_ID>', {
              permissions: ['public_profile'],
            });
          if (type === 'success') {
            // Get the user's name using Facebook's Graph API
            const response = await fetch(
              `https://graph.facebook.com/me?access_token=${token}`);
            Alert.alert(
              'Logged in!',
              `Hi ${(await response.json()).name}!`,
            );
          }
        }

      Given a valid Facebook application ID in place of ``<APP_ID>``, the code
      above will prompt the user to log into Facebook then display the user's
      name. This uses React Native's `fetch
      <https://facebook.github.io/react-native/docs/network.html#fetch>`_ to
      query Facebook's `Graph API
      <https://developers.facebook.com/docs/graph-api>`_.


Deploying to a standalone app on Android
""""""""""""""""""""""""""""""""""""""""

1. Build the standalone app
2. Run ``keytool -list -printcert -jarfile growler.apk | grep SHA1 | awk '{ print $2 }' | xxd -r -p | openssl base64`` (where ``growler.apk`` is the name of the apk produced in step 1).
3. Take the output from that and add it to the ``Key Hashes`` option in your Facebook developer app page, under Basic Settings. Save and you're done.
