Google
======

Provides Google authentication integration for Exponent apps, using either
the native Google Sign In SDK (only in standalone apps) or a system web browser
(not WebView, so credentials saved on the device can be re-used!).

Once you have the token, if you would like to make further calls to the Google API,
you can use Google's `REST APIs
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

Usage
-----

.. function:: Exponent.Google.logInAsync(options)

  Prompts the user to log into Google and grants your app permission
  to access some of their Google data, as specified by the scopes.

   :param object options:
      A map of options:

      * **behavior** (*string*) -- The type of behavior to use for login,
        either ``web`` or ``system``. Native (``system``) can only be used
        inside of a standalone app when built using the steps described below.
        Default is ``web`` inside of Exponent app, and ``system`` in
        standalone. The only case where you would need to change this is if
        you would prefer to use ``web`` inside of a standalone app.

      * **scopes** (*array*) -- An array specifying the scopes to ask
        for from Google for this login (`more information here <https://gsuite-developers.googleblog.com/2012/01/tips-on-using-apis-discovery-service.html>`_).
        Default scopes are ``['profile', 'email']``.

      * **androidClientId** (*string*) -- The Android client id registered with Google for use in the Exponent client app.

      * **iosClientId** (*string*) -- The iOS client id registered with Google for use in the Exponent client app.

      * **androidStandaloneAppClientId** (*string*) -- The Android client id registered with Google for use in a standalone app.

      * **iosStandaloneClientId** (*string*) -- The iOS client id registered with Google for use in a standalone app.

   :returns:
      If the user or Google cancelled the login, returns ``{ type: 'cancel' }``.

      Otherwise, returns ``{ type: 'success', accessToken, idToken,
      serverAuthCode, user: {...profileInformation} }``. ``accessToken`` is a string
      giving the access token to use with Google HTTP API requests.

Using it inside of the Exponent app
-----------------------------------

In the Exponent client app, you can only use browser-based login (this works very well
actually because it re-uses credentials saved in your system browser). If you build
a standalone app, you can use the native login for the platform.

To use Google Sign In, you will need to create a project on the Google
Developer Console and create an OAuth 2.0 client ID. This is, unfortunately,
super annoying to do and we wish there was a way we could automate this for
you, but at the moment the Google Developer Console does not expose an API.
*You also need to register a separate set of Client IDs for a standalone app,
the process for this is described later in this document*.

- **Get an app set up on the Google Developer Console**
  * Go to the `Credentials Page <https://console.developers.google.com/apis/credentials>`_
  * Create an app for your project if you haven't already.
  * Once that is complete, click "Create Credentials" and then "OAuth client ID." You will be prompted to set the product name on the consent screen, go ahead and do that.

- **Create an iOS OAuth Client ID**

  * Select "iOS Application" as the Application Type. Give it a name if you want (maybe "iOS Development").
  * Use ``host.exp.exponent`` as the bundle identifier.
  * Click "Create"
  * You will now see a modal with the client ID.
  * The client ID is used in the ``iosClientId`` option for ``Exponent.Google.loginAsync`` (see code example below).

- **Create an Android OAuth Client ID**

  * Select "iOS Application" as the Application Type. Give it a name if you want (maybe "Android Development").
  * Enter ``AD:15:BE:F8:B5:23:99:96:7E:E7:C1:1B:37:90:D5:84:60:27:91:7E`` as the "Signing-certificate fingerprint".
  * Use ``host.exp.exponent`` as the "Package name".
  * Click "Create"
  * You will now see a modal with the Client ID.
  * The client ID is used in the ``androidClientId`` option for ``Exponent.Google.loginAsync`` (see code example below).


- **Add the Client IDs to your app**

  .. code-block:: javascript

    import Exponent from 'exponent';

    async function signInWithGoogleAsync() {
      try {
        const result = await Exponent.Google.logInAsync({
          androidClientId: YOUR_CLIENT_ID_HERE,
          iosClientId: YOUR_CLIENT_ID_HERE,
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

Deploying to a standalone app on Android
----------------------------------------

If you want to use native sign in for a standalone app, you can follow these
steps. If not, you can just specify ``behavior: 'web'`` in the options when
using ``signInAsync`` and skip the following steps.

1. If you haven't created a "Web Application" client ID as described above, do that now. You will need the client ID for later.
2. Build the standalone app. You will need this for later.
3. Go to your app in the Google Developer console (you may have created this in step 1 or before).
4. Click "Add Credentials" and then "API Key".
5. Click "Restrict Key".
6. Choose "Android apps" from "Key restriction", then click "Add package name and fingerprint".
7. Run ``keytool -list -printcert -jarfile growler.apk | grep SHA1 | awk '{ print $2 }'`` (where ``growler.apk`` is the name of the apk produced in step 2).
8. Fill in your Take the output from step 7 and insert it in the "Signing-certificate fingerprint" field.
9. Add the package name from ``exp.json`` (eg: ca.brentvatne.growlerprowler) to the Package name field. Press save.
10. Open ``exp.json`` and add the client id to the ``android.config.googleSignIn.apiKey``.
11. Run ``keytool -list -printcert -jarfile growler.apk | grep SHA1 | awk '{ print $2 } | sed -e 's/\://g'`` (where ``growler.apk`` is the name of the apk produced in step 2).
12. Add the result from step 11 to ``exp.json`` under ``android.config.googleSignIn.certificateHash``.
13. When you use ``Exponent.Google.logInAsync(..)``, be sure to pass in the Web Application client ID from step 1 as the ``webClientId`` option. I have no idea why Google requires this on Android, so let's just blindly follow the incantation.
14. Rebuild your standalone app.

Deploying to a standalone app on iOS
------------------------------------

If you want to use native sign in for a standalone app, you can follow these
steps. If not, you can just specify ``behavior: 'web'`` in the options when
using ``signInAsync`` and skip the following steps.

1. Add a ``bundleIdentifier`` to your ``exp.json`` if you don't already have one.
2. Create an app in the Google Developer Console (if you haven't already for this project).
3. Click "Add Credentials" and then "OAuth client ID".
4. Choose "iOS" as the "Application Type".
5. Provide your ``bundleIdentifier`` in the "Bundle ID" field, then press "Create".
6. Add the given "iOS URL scheme" to your ``exp.json`` under ``ios.config.googleSignIn.reservedClientId``.
7. Wherever you use ``Exponent.Google.logInAsync``, provide the "Client ID" as the ``iosClientId`` option, for example: ``Exponent.Google.logInAsync({iosClientId: YOUR_CLIENT_ID, ...etc});``.
8. Rebuild your standalone app.
