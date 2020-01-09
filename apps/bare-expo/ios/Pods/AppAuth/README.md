![AppAuth for iOS and macOS](https://rawgit.com/openid/AppAuth-iOS/master/appauth_lockup.svg)
[![Build Status](https://travis-ci.org/openid/AppAuth-iOS.svg?branch=master)](https://travis-ci.org/openid/AppAuth-iOS)
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)

AppAuth for iOS and macOS is a client SDK for communicating with 
[OAuth 2.0](https://tools.ietf.org/html/rfc6749) and 
[OpenID Connect](http://openid.net/specs/openid-connect-core-1_0.html) providers. 
It strives to
directly map the requests and responses of those specifications, while following
the idiomatic style of the implementation language. In addition to mapping the
raw protocol flows, convenience methods are available to assist with common
tasks like performing an action with fresh tokens.

It follows the best practices set out in 
[RFC 8252 - OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252)
including using `SFAuthenticationSession` and `SFSafariViewController` on iOS
for the auth request. `UIWebView` and `WKWebView` are explicitly *not*
supported due to the security and usability reasons explained in
[Section 8.12 of RFC 8252](https://tools.ietf.org/html/rfc8252#section-8.12).

It also supports the [PKCE](https://tools.ietf.org/html/rfc7636) extension to
OAuth, which was created to secure authorization codes in public clients when
custom URI scheme redirects are used. The library is friendly to other
extensions (standard or otherwise), with the ability to handle additional params
in all protocol requests and responses.

## Specification

### iOS

#### Supported Versions

AppAuth supports iOS 7 and above.

iOS 9+ uses the in-app browser tab pattern
(via `SFSafariViewController`), and falls back to the system browser (mobile
Safari) on earlier versions.

#### Authorization Server Requirements

Both Custom URI Schemes (all supported versions of iOS) and Universal Links
(iOS 9+) can be used with the library.

In general, AppAuth can work with any authorization server that supports
native apps, as documented in [RFC 8252](https://tools.ietf.org/html/rfc8252),
either through custom URI scheme redirects, or universal links.
Authorization servers that assume all clients are web-based, or require clients to maintain
confidentiality of the client secrets may not work well.

### macOS

#### Supported Versions

AppAuth supports macOS (OS X) 10.9 and above.

#### Authorization Server Requirements

AppAuth for macOS supports both custom schemes; a loopback HTTP redirects
via a small embedded server.

In general, AppAuth can work with any authorization server that supports
native apps, as documented in [RFC 8252](https://tools.ietf.org/html/rfc8252);
either through custom URI schemes, or loopback HTTP redirects.
Authorization servers that assume all clients are web-based, or require clients to maintain
confidentiality of the client secrets may not work well.

## Try

Want to try out AppAuth? Just run:

    pod try AppAuth

Follow the instructions in [Examples/README.md](Examples/README.md) to configure
with your own OAuth client (you need to update three configuration points with your
client info to try the demo).

## Setup

AppAuth supports three options for dependency management.

### CocoaPods

With [CocoaPods](https://guides.cocoapods.org/using/getting-started.html),
add the following line to your `Podfile`:

    pod 'AppAuth'

Then, run `pod install`.

### Carthage

With [Carthage](https://github.com/Carthage/Carthage), add the following
line to your `Cartfile`:

    github "openid/AppAuth-iOS" "master"

Then, run `carthage bootstrap`.

### Static Library

You can also use AppAuth as a static library. This requires linking the library
and your project, and including the headers.  Here is a suggested configuration:

1. Create an Xcode Workspace.
2. Add `AppAuth.xcodeproj` to your Workspace.
3. Include libAppAuth as a linked library for your target (in the "General ->
Linked Framework and Libraries" section of your target).
4. Add `AppAuth-iOS/Source` to your search paths of your target ("Build Settings ->
"Header Search Paths").

## Auth Flow

AppAuth supports both manual interaction with the authorization server
where you need to perform your own token exchanges, as well as convenience
methods that perform some of this logic for you. This example uses the
convenience method, which returns either an `OIDAuthState` object, or an error.

`OIDAuthState` is a class that keeps track of the authorization and token
requests and responses, and provides a convenience method to call an API with
fresh tokens. This is the only object that you need to serialize to retain the
authorization state of the session.

### Configuration

You can configure AppAuth by specifying the endpoints directly:

<sub>Objective-C</sub>
```objc
NSURL *authorizationEndpoint =
    [NSURL URLWithString:@"https://accounts.google.com/o/oauth2/v2/auth"];
NSURL *tokenEndpoint =
    [NSURL URLWithString:@"https://www.googleapis.com/oauth2/v4/token"];

OIDServiceConfiguration *configuration =
    [[OIDServiceConfiguration alloc]
        initWithAuthorizationEndpoint:authorizationEndpoint
                        tokenEndpoint:tokenEndpoint];

// perform the auth request...
```

<sub>Swift</sub>
```swift
let authorizationEndpoint = URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!
let tokenEndpoint = URL(string: "https://www.googleapis.com/oauth2/v4/token")!
let configuration = OIDServiceConfiguration(authorizationEndpoint: authorizationEndpoint,
                                            tokenEndpoint: tokenEndpoint)

// perform the auth request...
```

Or through discovery:

<sub>Objective-C</sub>
```objc
NSURL *issuer = [NSURL URLWithString:@"https://accounts.google.com"];

[OIDAuthorizationService discoverServiceConfigurationForIssuer:issuer
    completion:^(OIDServiceConfiguration *_Nullable configuration,
                 NSError *_Nullable error) {

  if (!configuration) {
    NSLog(@"Error retrieving discovery document: %@",
          [error localizedDescription]);
    return;
  }

  // perform the auth request...
}];
```

<sub>Swift</sub>
```swift
let issuer = URL(string: "https://accounts.google.com")!

// discovers endpoints
OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) { configuration, error in
  guard let config = configuration else {
    print("Error retrieving discovery document: \(error?.localizedDescription ?? "Unknown error")")
    return
  }

  // perform the auth request...
}
```

### Authorizing – iOS

First, you need to have a property in your `UIApplicationDelegate`
implementation to hold the session, in order to continue the authorization flow
from the redirect. In this example, the implementation of this delegate is
a class named `AppDelegate`, if your app's application delegate has a different
name, please update the class name in samples below accordingly.

<sub>Objective-C</sub>
```objc
@interface AppDelegate : UIResponder <UIApplicationDelegate>
// property of the app's AppDelegate
@property(nonatomic, strong, nullable) id<OIDExternalUserAgentSession> currentAuthorizationFlow;
@end
```

<sub>Swift</sub>
```swift
class AppDelegate: UIResponder, UIApplicationDelegate {
  // property of the app's AppDelegate
  var currentAuthorizationFlow: OIDExternalUserAgentSession?
}
```


And your main class, a property to store the auth state:

<sub>Objective-C</sub>
```objc
// property of the containing class
@property(nonatomic, strong, nullable) OIDAuthState *authState;
```
<sub>Swift</sub>
```swift
// property of the containing class
private var authState: OIDAuthState?
```


Then, initiate the authorization request. By using the 
`authStateByPresentingAuthorizationRequest` convenience method, the token
exchange will be performed automatically, and everything will be protected with
PKCE (if the server supports it). AppAuth also lets you perform these
requests manually. See the `authNoCodeExchange` method in the included Example
app for a demonstration:

<sub>Objective-C</sub>
```objc
// builds authentication request
OIDAuthorizationRequest *request =
    [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                  clientId:kClientID
                                                    scopes:@[OIDScopeOpenID,
                                                             OIDScopeProfile]
                                               redirectURL:kRedirectURI
                                              responseType:OIDResponseTypeCode
                                      additionalParameters:nil];

// performs authentication request
AppDelegate *appDelegate =
    (AppDelegate *)[UIApplication sharedApplication].delegate;
appDelegate.currentAuthorizationFlow =
    [OIDAuthState authStateByPresentingAuthorizationRequest:request
        presentingViewController:self
                        callback:^(OIDAuthState *_Nullable authState,
                                   NSError *_Nullable error) {
  if (authState) {
    NSLog(@"Got authorization tokens. Access token: %@",
          authState.lastTokenResponse.accessToken);
    [self setAuthState:authState];
  } else {
    NSLog(@"Authorization error: %@", [error localizedDescription]);
    [self setAuthState:nil];
  }
}];
```

<sub>Swift</sub>
```swift
// builds authentication request
let request = OIDAuthorizationRequest(configuration: configuration,
                                      clientId: clientID,
                                      clientSecret: clientSecret,
                                      scopes: [OIDScopeOpenID, OIDScopeProfile],
                                      redirectURL: redirectURI,
                                      responseType: OIDResponseTypeCode,
                                      additionalParameters: nil)

// performs authentication request
print("Initiating authorization request with scope: \(request.scope ?? "nil")")

let appDelegate = UIApplication.shared.delegate as! AppDelegate

appDelegate.currentAuthorizationFlow =
    OIDAuthState.authState(byPresenting: request, presenting: self) { authState, error in
  if let authState = authState {
    self.setAuthState(authState)
    print("Got authorization tokens. Access token: " +
          "\(authState.lastTokenResponse?.accessToken ?? "nil")")
  } else {
    print("Authorization error: \(error?.localizedDescription ?? "Unknown error")")
    self.setAuthState(nil)
  }
}
```

*Handling the Redirect*

The authorization response URL is returned to the app via the iOS openURL
app delegate method, so you need to pipe this through to the current
authorization session (created in the previous session):

<sub>Objective-C</sub>
```objc
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<NSString *, id> *)options {
  // Sends the URL to the current authorization flow (if any) which will
  // process it if it relates to an authorization response.
  if ([_currentAuthorizationFlow resumeExternalUserAgentFlowWithURL:url]) {
    _currentAuthorizationFlow = nil;
    return YES;
  }

  // Your additional URL handling (if any) goes here.

  return NO;
}
```

<sub>Swift</sub>
```swift
func application(_ app: UIApplication,
                 open url: URL,
                 options: [UIApplicationOpenURLOptionsKey : Any] = [:]) -> Bool {
  // Sends the URL to the current authorization flow (if any) which will
  // process it if it relates to an authorization response.
  if let authorizationFlow = self.currentAuthorizationFlow,
                             authorizationFlow.resumeExternalUserAgentFlow(with: url) {
    self.currentAuthorizationFlow = nil
    return true
  }

  // Your additional URL handling (if any)

  return false
}
```

### Authorizing – MacOS

On macOS, the most popular way to get the authorization response redirect is to
start a local HTTP server on the loopback interface (limited to incoming
requests from the user's machine only). When the authorization is complete, the
user is redirected to that local server, and the authorization response can be
processed by the app. AppAuth takes care of managing the local HTTP server
lifecycle for you.

> #### :bulb: Alternative: Custom URI Schemes
> Custom URI schemes are also supported on macOS, but some browsers display
> an interstitial, which reduces the usability. For an example on using custom
> URI schemes with macOS, See `Example-Mac`.

To receive the authorization response using a local HTTP server, first you need
to have an instance variable in your main class to retain the HTTP redirect
handler:

<sub>Objective-C</sub>
```objc
OIDRedirectHTTPHandler *_redirectHTTPHandler;
```

Then, as the port used by the local HTTP server varies, you need to start it
before building the authorization request, in order to get the exact redirect
URI to use:

<sub>Objective-C</sub>
```objc
static NSString *const kSuccessURLString =
    @"http://openid.github.io/AppAuth-iOS/redirect/";
NSURL *successURL = [NSURL URLWithString:kSuccessURLString];

// Starts a loopback HTTP redirect listener to receive the code.  This needs to be started first,
// as the exact redirect URI (including port) must be passed in the authorization request.
_redirectHTTPHandler = [[OIDRedirectHTTPHandler alloc] initWithSuccessURL:successURL];
NSURL *redirectURI = [_redirectHTTPHandler startHTTPListener:nil];
```

Then, initiate the authorization request. By using the 
`authStateByPresentingAuthorizationRequest` convenience method, the token
exchange will be performed automatically, and everything will be protected with
PKCE (if the server supports it). By assigning the return value to the
`OIDRedirectHTTPHandler`'s `currentAuthorizationFlow`, the authorization will
continue automatically once the user makes their choice:

```objc
// builds authentication request
OIDAuthorizationRequest *request =
    [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                  clientId:kClientID
                                              clientSecret:kClientSecret
                                                    scopes:@[ OIDScopeOpenID ]
                                               redirectURL:redirectURI
                                              responseType:OIDResponseTypeCode
                                      additionalParameters:nil];
// performs authentication request
__weak __typeof(self) weakSelf = self;
_redirectHTTPHandler.currentAuthorizationFlow =
    [OIDAuthState authStateByPresentingAuthorizationRequest:request
                        callback:^(OIDAuthState *_Nullable authState,
                                   NSError *_Nullable error) {
  // Brings this app to the foreground.
  [[NSRunningApplication currentApplication]
      activateWithOptions:(NSApplicationActivateAllWindows |
                           NSApplicationActivateIgnoringOtherApps)];

  // Processes the authorization response.
  if (authState) {
    NSLog(@"Got authorization tokens. Access token: %@",
          authState.lastTokenResponse.accessToken);
  } else {
    NSLog(@"Authorization error: %@", error.localizedDescription);
  }
  [weakSelf setAuthState:authState];
}];
```

### Making API Calls

AppAuth gives you the raw token information, if you need it. However, we
recommend that users of the `OIDAuthState` convenience wrapper use the provided
`performActionWithFreshTokens:` method to perform their API calls to avoid
needing to worry about token freshness:

<sub>Objective-C</sub>
```objc
[_authState performActionWithFreshTokens:^(NSString *_Nonnull accessToken,
                                           NSString *_Nonnull idToken,
                                           NSError *_Nullable error) {
  if (error) {
    NSLog(@"Error fetching fresh tokens: %@", [error localizedDescription]);
    return;
  }

  // perform your API request using the tokens
}];
```

<sub>Swift</sub>
```swift
let userinfoEndpoint = URL(string:"https://openidconnect.googleapis.com/v1/userinfo")!
self.authState?.performAction() { (accessToken, idToken, error) in

  if error != nil  {
    print("Error fetching fresh tokens: \(error?.localizedDescription ?? "Unknown error")")
    return
  }
  guard let accessToken = accessToken else {
    return
  }

  // Add Bearer token to request
  var urlRequest = URLRequest(url: userinfoEndpoint)
  urlRequest.allHTTPHeaderFields = ["Authorization": "Bearer \(accessToken)"]

  // Perform request...
}
```

### Custom User-Agents

Each OAuth flow involves presenting an external user-agent to the user, that
allows them to interact with the OAuth authorization server. Typical examples
of a user-agent are the user's browser, or an in-app browser tab incarnation
like `ASWebAuthenticationSession` on iOS.

AppAuth ships with several implementations of an external user-agent out of the
box, including defaults for iOS and macOS suitable for most cases. The default
user-agents typically share persistent cookies with the system default browser,
to improve the chance that the user doesn't need to sign-in all over again.

It is possible to change the user-agent that AppAuth uses, and even write your
own - all without needing to fork the library.

All implementations of the external user-agent, be they included or created by
you need to conform to the 
[`OIDExternalUserAgent`](http://openid.github.io/AppAuth-iOS/docs/latest/protocol_o_i_d_external_user_agent-p.html)
protocol.

Instances of the `OIDExternalUserAgent`are passed into
[`OIDAuthState.authStateByPresentingAuthorizationRequest:externalUserAgent:callback`](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_auth_state.html#ac762fe2bf95c116f0b437419be211fa1)
and/or 
[`OIDAuthorizationService.presentAuthorizationRequest:externalUserAgent:callback:`](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_authorization_service.html#ae551f8e6887366a46e49b09b37389b8f)
rather than using the platform-specific convenience methods (which use the 
default user-agents for their respective platforms), like 
[`OIDAuthState.authStateByPresentingAuthorizationRequest:presentingViewController:callback:`](http://openid.github.io/AppAuth-iOS/docs/latest/category_o_i_d_auth_state_07_i_o_s_08.html#ae32fd0732cd3192cd5219f2655a4c85c).

Popular use-cases for writing your own user-agent implementation include needing
to style the user-agent in ways not supported by AppAuth, and implementing a
fully custom flow with your own business logic. You can take one of the existing
implementations as a starting point to copy, rename, and customize to your
needs.

#### Custom Browser User-Agent

AppAuth for iOS includes a few extra user-agent implementations which you can
try, or use as a reference for your own implementation. One of them,
[`OIDExternalUserAgentIOSCustomBrowser`](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_external_user_agent_i_o_s_custom_browser.html)
enables you to use a different browser for authentication, like Chrome for iOS
or Firefox for iOS.

Here's how to configure AppAuth to use a custom browser using the
`OIDExternalUserAgentIOSCustomBrowser` user agent:

First, add the following array to your
[Info.plist](https://github.com/openid/AppAuth-iOS/blob/135f99d2cb4e9d18d310ac2588b905e612461561/Examples/Example-iOS_ObjC/Source/Info.plist#L34)
(in XCode, right click -> Open As -> Source Code)

```
	<key>LSApplicationQueriesSchemes</key>
	<array>
		<string>googlechromes</string>
		<string>opera-https</string>
		<string>firefox</string>
	</array>
```

This is required so that AppAuth can test for the browser and open the app store
if it's not installed (the default behavior of this user-agent). You only need
to include the URL scheme of the actual browser you intend to use.

<sub>Objective-C</sub>
```objc
// performs authentication request
AppDelegate *appDelegate =
    (AppDelegate *)[UIApplication sharedApplication].delegate;
id<OIDExternalUserAgent> userAgent =
    [OIDExternalUserAgentIOSCustomBrowser CustomBrowserChrome];
appDelegate.currentAuthorizationFlow =
    [OIDAuthState authStateByPresentingAuthorizationRequest:request
        externalUserAgent:self
                 callback:^(OIDAuthState *_Nullable authState,
                                   NSError *_Nullable error) {
  if (authState) {
    NSLog(@"Got authorization tokens. Access token: %@",
          authState.lastTokenResponse.accessToken);
    [self setAuthState:authState];
  } else {
    NSLog(@"Authorization error: %@", [error localizedDescription]);
    [self setAuthState:nil];
  }
}];
```

That's it! With those two changes (which you can try on the included sample),
AppAuth will use Chrome iOS for the authorization request (and open Chrome in
the App Store if it's not installed).

⚠️**Note: the `OIDExternalUserAgentIOSCustomBrowser` user-agent is not intended for consumer apps**. It is designed for
advanced enterprise use-cases where the app developers have greater control over
the operating environment and have special requirements that require a custom
browser like Chrome.

You don't need to stop with the included external user agents either! Since the
[`OIDExternalUserAgent`](http://openid.github.io/AppAuth-iOS/docs/latest/protocol_o_i_d_external_user_agent-p.html)
protocol is part of AppAuth's public API, you can implement your own versions of
it. In the above example,
`userAgent = [OIDExternalUserAgentIOSCustomBrowser CustomBrowserChrome]` would
be replaced with an instantiation of your user-agent implementation.

## API Documentation

Browse the [API documentation](http://openid.github.io/AppAuth-iOS/docs/latest/annotated.html).

## Included Samples

Sample apps that explore core AppAuth features are available for iOS and macOS; follow the instructions in [Examples/README.md](Examples/README.md) to get started.
