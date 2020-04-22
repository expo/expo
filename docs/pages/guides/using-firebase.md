---
title: Using Firebase
---

[Firebase](https://firebase.google.com/) gives you functionality like analytics, databases, messaging and crash reporting so you can move quickly and focus on your users.  Firebase is built on Google infrastructure and scales automatically, for even the largest apps.

## Usage with Expo

If you'd like to use Firebase in the Expo client with the managed workflow, we'd recommend using the [Firebase JS SDK](https://github.com/firebase/firebase-js-sdk). It supports Authentication, Firestore, Database, Storage, and Functions on React Native. Other modules like Analytics are [not supported through the Firebase JS SDK](https://firebase.google.com/support/guides/environments_js-sdk), but you can use [expo-firebase-analaytics](../../sdk/firebase-analytics) for that.
If you'd like access to the full suite of native firebase tools, we recommend using the bare workflow and [react-native-firebase](https://github.com/invertase/react-native-firebase), because we cannot support this in the Expo client currently.

Luckily, the Firebase JavaScript SDK starting from version 3.1+ has almost full support for React Native, so adding it to our Expo app is super easy. The one caveat covered later in this guide is that the user login components typically provided by the Firebase SDKs will **not** work for React Native, and thus we will have to work around it.

See the [official Firebase blog post announcing React Native compatibility](https://firebase.googleblog.com/2016/07/firebase-react-native.html).

> **Note:** This guide mostly covers Firebase Realtime Database (and some Firestore as well). For more background on why some Firebase services are not supported, please read [Brent Vatne's response on Canny](https://expo.canny.io/feature-requests/p/full-native-firebase-integration).

##### Table of Contents
- [Firebase SDK Setup](#firebase-sdk-setup)
- [Storing Data and Receiving Updates](#storing-data-and-receiving-updates)
- [User Authentication](#user-authentication)
- [Using Expo with Firestore](#using-expo-with-firestore)
- [Recording events with Analytics](#recording-events-with-analytics)

## Firebase SDK Setup

First we need to setup a Firebase Account and create a new project. We will be using the JavaScript SDK provided by Firebase, so pull it into your Expo project.

`expo install firebase`.

The Firebase console will provide you with an api key, and other identifiers for your project needed for initialization. [firebase-web-start](https://firebase.google.com/docs/database/web/start) has a detailed description of what each field means and where to find them in your console.

```javascript
import * as firebase from 'firebase';

// Optionally import the services that you want to use
//import "firebase/auth";
//import "firebase/database";
//import "firebase/firestore";
//import "firebase/functions";
//import "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "api-key",
  authDomain: "project-id.firebaseapp.com",
  databaseURL: "https://project-id.firebaseio.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id",
  measurementId: "G-measurement-id"
};

firebase.initializeApp(firebaseConfig);
```

### Temporarily Bypass Default Security Rules

By default Firebase Database has a security rule setup such that all devices accessing your data must be authenticated. We obviously haven't setup any authentication yet, so we can disable it for now while we setup the rest of our app.

Go into the Firebase console for Database, and under the Rules tab you should see a default set of rules already provided for you. Change the rules to:

```javascript
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

[See Sample Firebase Rules](https://firebase.google.com/docs/database/security/quickstart#sample-rules) for good sets of rules for your data, including unauthenticated.

> **Note** It is important to note that this is temporary for development, and these rules should be thoroughly assessed before releasing an application.

## Storing Data and Receiving Updates

Storing data through Firebase can be pretty simple. Imagine we're creating a game where highscores are stored in Firebase for everyone to see. We could create a users bucket in our data that is referenced by each user. Setting their highscore would be straightforward.

```javascript
function storeHighScore(userId, score) {
  firebase.database().ref('users/' + userId).set({
    highscore: score
  });
}
```

Now let's say we wanted another client to listen to updates to the high score of a specific user. Firebase allows us to set a listener on a specific data reference and get notified each time there is an update to the data. In the example below, every time a highscore is updated for the given user, it will print it to console.

```javascript
setupHighscoreListener(userId) {
  firebase.database().ref('users/' + userId).on('value', (snapshot) => {
    const highscore = snapshot.val().highscore;
    console.log("New high score: " + highscore);
  });
}
```

## User Authentication

This was all pretty simple and works fairly out of the box for what Firebase JavaScript SDK provides. There is one caveat however. We skipped the authentication rules for simplicity at the beginning. Firebase SDKs provide authentication methods for developers, so they don't have to reimplement common login systems such as Google or Facebook login.

This includes UI elements in the Web, Android, and iOS SDK versions for Firebase, however, these UI components do not work with React Native and **should not** be called. Thankfully, Firebase gives us ways to authenticate our data access given that we provide user authentication ourselves.

### Login Methods

We can choose different login methods that make sense to our application. The login method choice is orthogonal to the Firebase Database access, however, we do need to let Firebase know how we have setup our login system such that it can correctly assign authentication tokens that match our user accounts for data access control. You can use anything you want, roll your own custom login system, or even forego it altogether if all your users can have unrestricted access.

### Facebook Login

A common login system many developers opt for is a simple Facebook login that users are already familiar with. Expo provides a great Facebook login component already, so we just need to plug that in.

See the Facebook section of our docs for information on how to set this up. This works just as well with Google and [several others](https://firebase.google.com/docs/reference/android/com/google/firebase/auth/AuthCredential#getProvider()).

### Tying Sign-In Providers with Firebase

Once you have added Facebook login to your Expo app, we need to adjust the Firebase console to check for it. Under the Authentication section in the console in the Sign-In Method tab, enable Facebook as a sign-in provider.

You can add whichever provider makes sense for you, or even add multiple providers. We will stick with Facebook for now since we already have a simple drop-in Expo component already built.

### Phone Authentication

To use phone authentication, you'll need the `expo-firebase-recaptcha` package. It provides a reCAPTCHA widget which is neccessary to verify that you are not a bot.

Please follow the instructions for the [expo-firebase-recaptcha](../../sdk/firebase-recaptcha) package on how to use phone auth.

### Reenable Data Access Security Rule

We need to re-enable the Data Security Rule in our Firebase console again to check for user authentication. This time our rules will be slightly more complicated.

For our example, let's say we want everyone to be able to read the high score for any user, but we want to restrict writes to only the user who the score belongs to. You wouldn't want anyone overwriting your highscore, would you?

```javascript
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Listening for Authentication

We are now ready to connect the Facebook login code with our Firebase Database implementation.

```javascript
firebase.initializeApp(config);

// Listen for authentication state to change.
firebase.auth().onAuthStateChanged((user) => {
  if (user != null) {
    console.log("We are authenticated now!");
  }

  // Do other things
});

async function loginWithFacebook() {
  await Facebook.initializeAsync(
     '<FACEBOOK_APP_ID>',
  );

  const { type, token } = await Facebook.logInWithReadPermissionsAsync(
    { permissions: ['public_profile'] }
  );

  if (type === 'success') {
    // Build Firebase credential with the Facebook access token.
    const credential = firebase.auth.FacebookAuthProvider.credential(token);

    // Sign in with credential from the Facebook user.
    firebase.auth().signInWithCredential(credential).catch((error) => {
      // Handle Errors here.
    });
  }
}
```

The Facebook login method is similar to what you see in the Facebook login guide, however, the token we receive from a successful login can be passed to the Firebase SDK to provide us with a Firebase credential via `firebase.auth.FacebookAuthProvider.credential`. We can then sign-in with this credential via `firebase.auth().signInWithCredential`.

The `firebase.auth().onAuthStateChanged` event allows us to set a listener when the authentication state has changed, so in our case, when the Facebook credential is used to successfully sign in to Firebase, we are given a user object that can be used for authenticated data access.

### Authenticated Data Updates with Firebase Realtime Database

Now that we have a user object for our authenticated user, we can adapt our previous `storeHighScore()` method to use the uid of the user object as our user reference. Since the `user.uid`'s are generated by Firebase automatically for authenticated users, this is a good way to reference our users bucket.

```javascript
function storeHighScore(user, score) {
  if (user != null) {
    firebase.database().ref('users/' + user.uid).set({
      highscore: score
    });
  }
}
```

## Using Expo with Firestore

[Firestore](https://firebase.google.com/docs/firestore/) is the successor to Firebase Realtime Database.

Here's one way to implement a data update using Firestore:

```javascript
import * as firebase from 'firebase'
import 'firebase/firestore';

const firebaseConfig = { ... }  // apiKey, authDomain, etc. (see above)

firebase.initializeApp(firebaseConfig);

const dbh = firebase.firestore();

dbh.collection("characters").doc("mario").set({
  employment: "plumber",
  outfitColor: "red",
  specialAttack: "fireball"
})
```

This sample was borrowed from [this forum post](https://forums.expo.io/t/open-when-an-expo-firebase-firestore-platform/4126/29).

## Recording events with Analytics

In order to record analytics events, the Expo Firebase Core and Analytics packages needs to be installed.

`expo install expo-firebase-analytics`

This package uses the native Firebase SDK in standalone apps and bare apps and a JavaScript based implementation on the standard Expo client.

To configure native Firebase, please follow the configuration instructions for the [expo-firebase-analytics](../../sdk/firebase-analytics) package.

```javascript
import * as Analytics from 'expo-firebase-analytics';

Analytics.logEvent('hero_spotted', {
  hero_name: 'Saitama'
});
```
