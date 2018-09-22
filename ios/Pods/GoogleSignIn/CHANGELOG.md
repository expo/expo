# 2016-03-04 -- v3.0.0
- Provides |givenName| and |familyName| properties on |GIDProfileData|.
- Allows setting the |loginHint| property on |GIDSignIn| to prefill the user's
  ID or email address in the sign-in flow.
- Removed the |UIViewController(SignIn)| category as well as the |delegate|
  property from |GIDSignInButton|.
- Requires that |uiDelegate| has been set properly on |GIDSignIn| and that
  SafariServices framework has been linked.
- Removes the dependency on StoreKit.
- Provides bitcode support.
- Requires Xcode 7.0 or above due to bitcode incompatibilities with Xcode 6.

# 2015-10-26 -- v2.4.0
- Updates sign-in button with the new Google logo.
- Supports domain restriction for sign-in.
- Allows refreshing ID tokens.

# 2015-10-09 -- v2.3.2
- No longer requires Xcode 7.

# 2015-10-01 -- v2.3.1
- Fixes a crash in |GIDProfileData|'s |imageURLWithDimension:|.

# 2015-09-25 -- v2.3.0
- Requires Xcode 7.0 or above.
- Uses SFSafariViewController for signing in on iOS 9.  |uiDelegate| must be
  set for this to work.
- Optimizes fetching user profile.
- Supports GTMFetcherAuthorizationProtocol in GIDAuthentication.

# 2015-07-15 -- v2.2.0
- Compatible with iOS 9 (beta).  Note that this version of the Sign-In SDK does
  not include bitcode, so you must set ENABLE_BITCODE to NO in your project if
  you use Xcode 7.
- Adds descriptive identifiers for GIDSignInButton's Auto Layout constraints.
- |signInSilently| no longer requires setting |uiDelegate|.

# 2015-06-17 -- v2.1.0
- Fixes Auto Layout issues with GIDSignInButton.
- Adds API to refresh access token in GIDAuthentication.
- Better exception description for unassigned clientID in GIDSignIn.
- Other minor bug fixes.

# 2015-05-28 -- v2.0.1
- Bug fixes

# 2015-05-21 -- v2.0.0
- Supports sign-in via UIWebView rather than app switching to a browser,
  configurable with the new |allowsSignInWithWebView| property.
- Now apps which have disabled the app switch to a browser via the
  |allowsSignInWithBrowser| and in-app web view via |allowsSignInWithWebView|
  properties have the option to display a prompt instructing the user to
  download the Google app from the App Store.
- Fixes sign-in button sizing issue when auto-layout is enabled
- |signInSilently| now calls the delegate with error when |hasAuthInKeychain|
  is |NO| as documented
- Other minor bug fixes

# 2015-03-12 -- v1.0.0
- New sign-in focused SDK with refreshed API
- Dynamically rendered sign-in button with contextual branding
- Basic profile support
- Added allowsSignInWithBrowser property
