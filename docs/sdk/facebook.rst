Facebook
========

Provides access to the Facebook's native API. Most of Facebook's API is
available through HTTP (such as the `Graph API
<https://developers.facebook.com/docs/graph-api/overview/>`_). Exponent only
exposes the bare minimum native API since it is best to use cross-platform
JavaScript code with HTTP requests (using React Native's `fetch
<https://facebook.github.io/react-native/docs/network.html>`_ API, for example)
to do as much of the work as possible.

.. function:: Exponent.Facebook.logInWithReadPermissionsAsync(appId, options)

   Log into Facebook to get an access token.

   :param string appId:
      The Facebook application ID for your application.

   :param object options:
      A map of options:

      * **permissions** (*array*) -- An array specifying the permissions to ask
        for from Facebook for this login. The permissions are strings as
        specified in the `Facebook API documentation
        <https://developers.facebook.com/docs/facebook-login/permissions>`_. By
        default is ``['public_profile', 'email', 'user_friends']``.

   :returns:
      If the user or Facebook cancelled the login, returns ``{ type: 'cancel' }``.

      Otherwise, returns ``{ type: 'success', token }`` where ``token`` is a
      string giving the access token to use with Facebook HTTP API requests.

