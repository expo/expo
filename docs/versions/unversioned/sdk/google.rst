Google
======

Provides Google integration for Exponent apps. Exponent exposes a minimal
native API since you can access Google's `REST APIs
<https://developers.google.com/apis-explorer/>`_ directly through HTTP (using
`fetch <https://facebook.github.io/react-native/docs/network.html#fetch>`_, for
example).

.. code-block:: javascript

  // Example of using the Google REST API
  async function getUserInfo(accessToken) {
    let userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}`},
    });

    return userInfoResponse;
  }

Using it inside of the Exponent app
"""""""""""""""""""""""""""""""""""

In the Exponent client app, you can only use WebView-based login. If you build
a standalone app, you can use the native login for the platform, as described
at the end of this doc.

To use Google Sign In, you will need to create a project on the Google
Developer Console and create an OAuth 2.0 client ID.

- Go to the `Credentials Page <https://console.developers.google.com/apis/credentials>`_
- Create an app for your project if you haven't already
- Once that is complete, click "Add Credentials" and then "OAuth client ID." You will be prompted to set the product name on the consent screen, go ahead and do that.
- Select "Web Application" as the Application Type. Give it a name if you want. You don't need to provide authorized origin.
- Add ``https://oauth.host.exp.com`` to the "Authorised redirect URIs"
- Click "Create"
- You will now see a modal with the client ID and secret.
- The client ID is used to sign in, as follows:

.. code-block:: javascript

  import Exponent from 'exponent';

  async function signInWithGoogleAsync() {
    try {
      const result = await Exponent.Google.logInAsync({
        webClientId: YOUR_CLIENT_ID_HERE,
        scopes: ['profile', 'email'],
      });

      if (result.type === 'success') {
        return result.accessToken;
      } else {
        return {cancelled: true};
      }
    } catch(e) {
      return {error: true};
    }
  }

.. function:: Exponent.Google.logInAsync(options)

  Prompts the user to log into Google and grants your app permission
  to access some of their Google data, as specified by the scopes.

   :param object options:
      A map of options:

      * **behavior** (*string*) -- The type of behavior to use for login,
        either web or native. Native can only be used inside of a standalone
        app when built using the steps described below. Default is web.

      * **scopes** (*array*) -- An array specifying the scopes to ask
        for from Google for this login (`more information here <https://gsuite-developers.googleblog.com/2012/01/tips-on-using-apis-discovery-service.html>`_).
        Default scopes are ``['profile', 'email']``.

      * **webClientId** (*string*) -- The client id registered with Google for the app, used with the web behavior.

      * **iosClientId** (*string*) -- The client id registered with Google for the, used with the native behavior inside of a standalone app.

   :returns:
      If the user or Google cancelled the login, returns ``{ type: 'cancel' }``.

      Otherwise, returns ``{ type: 'success', accessToken, idToken,
      serverAuthCode, user: {...profileInformation} }``. ``accessToken`` is a string
      giving the access token to use with Google HTTP API requests.

Deploying to a standalone app on Android
""""""""""""""""""""""""""""""""""""""""

If you want to use native sign in for a standalone app, you can follow these
steps. If not, you can just specify ``behavior: 'web'`` in the options when
using ``signInAsync`` and skip the following steps.

1. Build the standalone app
2. Run ``keytool -list -printcert -jarfile growler.apk | grep SHA1 | awk '{ print $2 }'`` (where ``growler.apk`` is the name of the apk produced in step 1). You'll need the output from this later.
3. Create an app in the Google Developer Console (if you haven't already for this project).
4. Click "Add Credentials" and then "OAuth client ID".
5. Choose "Android" as the "Application Type".
6. Take the output from step 2 and insert it in the "Signing-certificate fingerprint" field.
7. Add the package name (eg: ca.brentvatne.growlerprowler) to the Package name field. Press save.
8. Open ``exp.json`` and add the api key to the ``android.config.googleSignIn.apiKey``.
9. Rebuild your standalone app.

Deploying to a standalone app on iOS
""""""""""""""""""""""""""""""""""""

If you want to use native sign in for a standalone app, you can follow these
steps. If not, you can just specify ``behavior: 'web'`` in the options when
using ``signInAsync`` and skip the following steps.

1. Add a ``bundleIdentifier`` to your ``exp.json`` if you don't already have one.
2. Create an app in the Google Developer Console (if you haven't already for this project).
3. Click "Add Credentials" and then "OAuth client ID".
4. Choose "iOS" as the "Application Type".
5. Provide your ``bundleIdentifier`` in the "Bundle ID" field, then press "Create".
6. Add the given client ID to your ``exp.json`` under ``ios.config.googleSignIn.reservedClientId``.
7. Wherever you use ``Exponent.Google.logInAsync``, provide the client id as the ``iosClientId`` option, for example: ``Exponent.Google.logInAsync({iosClientId: YOUR_CLIENT_ID, ...etc});``.
8. Rebuild your standalone app.
