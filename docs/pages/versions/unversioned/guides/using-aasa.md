---
title: Using Apple App Site Association
---

Connect your Expo iOS app to your Expo website for deep linking.

### Prerequists:

- An Apple team ID (this may require a paid apple developer account)
- A web URL where you'll host your Expo website.
- Know your iOS project's bundle identifier (this can be changed).
- A physical iOS device. AASA doesn't work in the simulator.

## Setup web

1. Configure your `app.json`:

```json5
{
    "ios": {
        // The bundle ID for your app must be set.
        "bundleIdentifier": "com.bacon.test.aasa",
        // Define the URL for your app with the `applinks:` prefix. These are built into the iOS IPA and need to be installed onto your phone after the website is configured and deployed.
        "associatedDomains": [
            // For universal linking use the `applinks:` prefix.
            "applinks:aasa.netlify.com",
            // To share credentials like passwords use the `webcredentials:` prefix
            // https://developer.apple.com/documentation/security/password_autofill/setting_up_an_app_s_associated_domains?language=objc
            "webcredentials:aasa.netlify.com",
            // https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/Handoff/AdoptingHandoff/AdoptingHandoff.html#//apple_ref/doc/uid/TP40014338-CH2-SW10
            "activitycontinuation:aasa.netlify.com",
        ],
        // Your Apple Team ID.
        "teamId": "QQ57RJ5UTD",
        // The paths you want to add deep linking to.
        "aasaPaths": ["*"]
    }
}
```

2. Build and deploy your [Expo web project](../distribution/publishing-websites.md). 
  - This will create a `/.well-known/apple-app-site-association` with all of the values you defined in your `app.json`. 
  - Ensure it's deployed before you install your native app. iOS installs the `apple-app-site-association` as soon as it's downloaded, updated, or rebuilt.

# Setup native

At this point you can build an expo project and publish it to Test Flight. It might be easier to customize your project with the bare-workflow on a new branch, then switch back to managed later.

## Bare workflow

1. `expo detach` and choose `bare`
2. `cd ios && pod install`
3. open your `.xcworkspace` file in xcode
4. change the bundle ID for your project and ensure the team is correctly set to the team you defined in your `app.json`.
5. Create `entitlements`, select `associatedDomains` and add the associated domains that you defined in your `app.json`
6. Build you project onto a physical device (AASA doesn't work in the simulator).
7. In order to do something with the links once you've entered your native Expo app, you need to setup and use the [Linking API][rn-linking].
  - Open the `AppDelegate.m` and add the following:
    
    ```objective-c
    // iOS 9.x or newer
    #import <React/RCTLinkingManager.h>

    @implementation AppDelegate

    - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
        return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
    }

    - (BOOL)application:(UIApplication *)application
        openURL:(NSURL *)url
        options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
        {
        return [RCTLinkingManager application:application openURL:url options:options];
    }

    @end
    ```

# Usage

1. Open your production Expo website in the Safari app.
2. navigate to one of the paths you defined in your `app.json`
  - A good sanity test would be using `"*"` as a path so that every page works for universal linking.
3. scroll up and you should see the linking option:

<img src="../../../static/images/aasa-usage-web.png" />

4. Pressing **open** should redirect you to your native app.
  - You can detect when the user opens the app via a like by using the [Linking API][rn-linking].

```js
import * as React from 'react';
import { Linking, Text } from 'react-native';

function useLinking(): string | null {
  const [link, setLink] = React.useState(null);

  React.useEffect(() => {
    function onChange({ url }) {
      setLink(url);
    }
    (async () => {
      try {
        setLink(await Linking.getInitialURL());
      } catch (error) {}
    })();

    Linking.addEventListener('url', onChange);

    return () => Linking.removeEventListener('url', onChange);
  }, []);

  return link;
}

export default function App() {
    const link = useLinking();

    return <Text>Link {link}</Text>
}
```

## Auto-fill Username and Password

### Web to native

Once you've setup the AASA for `webcredentials:`, you'll be able to use auto-fill values from your website in your native app.

You can sync auto-fill values by using the `textContentType` prop on a `TextInput` component.

> You won't be prompted to save password if `secureTextEntry` isn't on the password `TextInput`

```tsx
import React, { Component } from 'react';
import { TextInput } from 'react-native';

function AutoFillTextInput(props) {
  const [value, onChangeText] = React.useState('');

  return (
    <TextInput
       {...props}
       placeholderTextColor="gray"
       onChangeText={text => onChangeText(text)}
       value={value}
    />
  );
}

export default function App() {
    return (
        <>
            <AutoFillTextInput
                placeholder="Username"
                textContentType="username"
                keyboardType="email-address"
                autoComplete="username" />

            <AutoFillTextInput
                placeholder="Password"
                textContentType="password"
                secureTextEntry
                autoComplete="current-password" />
        </>
    )
}
```

You can use any of the `TextContentType` values:

```ts
type TextContentType =
  | 'none'
  | 'URL'
  | 'addressCity'
  | 'addressCityAndState'
  | 'addressState'
  | 'countryName'
  | 'creditCardNumber'
  | 'emailAddress'
  | 'familyName'
  | 'fullStreetAddress'
  | 'givenName'
  | 'jobTitle'
  | 'location'
  | 'middleName'
  | 'name'
  | 'namePrefix'
  | 'nameSuffix'
  | 'nickname'
  | 'organizationName'
  | 'postalCode'
  | 'streetAddressLine1'
  | 'streetAddressLine2'
  | 'sublocality'
  | 'telephoneNumber'
  | 'username'
  | 'password'
  | 'newPassword'
  | 'oneTimeCode';
```

<img src="aasa-auto-fill-example.png" />


### Native to web: [Shared Web Credential](https://developer.apple.com/documentation/security/shared_web_credentials/managing_shared_credentials?language=objc)

> This is not yet supported in the Expo workflow.

You can use an Apple API called **shared web credentials** to share credentials with your Expo website counterpart. If a user creates an account, updates details about that account (like changing the password), or deletes the account from within the iOS app, the credentials will be synced with iCloud and available in Safari.


[rn-linking]: https://facebook.github.io/react-native/docs/linking
