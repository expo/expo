# 2018-11-26 -- v4.4.0
- Removes the dependency on GTM OAuth 2.

# 2018-10-1 -- v4.3.0
- Supports Google's Enterprise Mobile Management.

# 2018-8-10 -- v4.2.0
- Adds `grantedScopes` to `GIDGoogleUser`, allowing confirmation of which scopes
  have been granted after a successful sign-in.
- Deprecates `accessibleScopes` in `GIDGoogleUser`, use `grantedScopes` instead.
- Localizes `GIDSignInButton` for hi (Hindi) and fr-CA (French (Canada)).
- Adds dependency to the system `LocalAuthentication` framework.

# 2018-1-8 -- v4.1.2
- Add `pod try` support for the GoogleSignIn CocoaPod.

# 2017-10-17 -- v4.1.1
- Fixes an issue that `GIDSignInUIDelegate`'s `signInWillDispatch:error:` was
  not called on iOS 11. Please note that it is intended that neither
  `signIn:presentViewController:` nor `signIn:dismissViewController:` is called
  on iOS 11 because SFAuthenticationSession is not presented by the app's view
  controller.

# 2017-09-13 -- v4.1.0
- Uses SFAuthenticationSession on iOS 11.

# 2017-02-06 -- v4.0.2
- No longer depends on GoogleAppUtilities.

# 2016-10-24 -- v4.0.1
- Switches to open source pod dependencies.
- Appearance of sign-in button no longer depends on requested scopes.

# 2016-04-21 -- v4.0.0
- GoogleSignIn pod now takes form of a static framework. Import with
  `#import <GoogleSignIn/GoogleSignIn.h>` in Objective-C.
- Adds module support. You can also use `@import GoogleSignIn;` in Objective-C,
  if module is enabled, and `import GoogleSignIn` in Swift without using a
  bridge-header.
- For users of the stand-alone zip distribution, multiple frameworks are now
  provided and all need to be added to a project. This decomposition allows more
  flexibility in case of duplicated dependencies.
- Removes deprecated method `checkGoogleSignInAppInstalled` from `GIDSignIn`.
- Removes `allowsSignInWithBrowser` and `allowsSignInWithWebView` properties
  from `GIDSignIn`.
- No longer requires adding bundle ID as a URL scheme supported by the app.

# 2016-03-04 -- v3.0.0
- Provides `givenName` and `familyName` properties on `GIDProfileData`.
- Allows setting the `loginHint` property on `GIDSignIn` to prefill the user's
  ID or email address in the sign-in flow.
- Removed the `UIViewController(SignIn)` category as well as the `delegate`
  property from `GIDSignInButton`.
- Requires that `uiDelegate` has been set properly on `GIDSignIn` and that
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
- Fixes a crash in `GIDProfileData`'s `imageURLWithDimension:`.

# 2015-09-25 -- v2.3.0
- Requires Xcode 7.0 or above.
- Uses SFSafariViewController for signing in on iOS 9.  `uiDelegate` must be
  set for this to work.
- Optimizes fetching user profile.
- Supports GTMFetcherAuthorizationProtocol in GIDAuthentication.

# 2015-07-15 -- v2.2.0
- Compatible with iOS 9 (beta).  Note that this version of the Sign-In SDK does
  not include bitcode, so you must set ENABLE_BITCODE to NO in your project if
  you use Xcode 7.
- Adds descriptive identifiers for GIDSignInButton's Auto Layout constraints.
- `signInSilently` no longer requires setting `uiDelegate`.

# 2015-06-17 -- v2.1.0
- Fixes Auto Layout issues with GIDSignInButton.
- Adds API to refresh access token in GIDAuthentication.
- Better exception description for unassigned clientID in GIDSignIn.
- Other minor bug fixes.

# 2015-05-28 -- v2.0.1
- Bug fixes

# 2015-05-21 -- v2.0.0
- Supports sign-in via UIWebView rather than app switching to a browser,
  configurable with the new `allowsSignInWithWebView` property.
- Now apps which have disabled the app switch to a browser via the
  `allowsSignInWithBrowser` and in-app web view via `allowsSignInWithWebView`
  properties have the option to display a prompt instructing the user to
  download the Google app from the App Store.
- Fixes sign-in button sizing issue when auto-layout is enabled
- `signInSilently` now calls the delegate with error when `hasAuthInKeychain`
  is `NO` as documented
- Other minor bug fixes

# 2015-03-12 -- v1.0.0
- New sign-in focused SDK with refreshed API
- Dynamically rendered sign-in button with contextual branding
- Basic profile support
- Added allowsSignInWithBrowser property
