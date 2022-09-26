---
title: Using Firebase
---

import { Terminal } from '~/ui/components/Snippet';

[Firebase](https://firebase.google.com/) gives you functionality like analytics, databases, messaging and crash reporting so you can move quickly and focus on your users. Firebase is built on Google infrastructure and scales automatically, for even the largest apps.

> This guide uses `firebase@9.1.0`. As of SDK 43, the Expo SDK no longer enforces or recommends any specific version of Firebase to use in your app. If you are using an older version of the `firebase` library in your project you may have to adapt the code examples below to match the version that you are using, with the help of the [Firebase JS SDK documentation](https://github.com/firebase/firebase-js-sdk).

## Usage with Expo Go

If you'd like to use Firebase in the Expo Go app, we recommend using the [Firebase JS SDK](https://github.com/firebase/firebase-js-sdk). It supports Authentication, Firestore & Realtime databases, Storage, and Functions on React Native. Other modules like Analytics are [not supported through the Firebase JS SDK](https://firebase.google.com/support/guides/environments_js-sdk), but you can use [`expo-firebase-analytics`](/versions/latest/sdk/firebase-analytics) for that.

If you'd like access to the full suite of native firebase tools, we recommend using the [React Native Firebase](https://rnfirebase.io/#expo) with a [development build](/development/introduction). React Native Firebase is not supported in the [Expo Go](https://expo.dev/expo-go) app.

> **Note:** This guide mostly covers Firebase Realtime Database (and some Firestore as well). For more background on why some Firebase services are not supported, please refer to the ["What goes into the Expo SDK?" FYI page](https://expo.fyi/whats-in-the-sdk).

## Firebase SDK Setup

First we need to setup a Firebase Account and create a new project. We will be using the JavaScript SDK provided by Firebase, so pull it into your Expo project.

<Terminal cmd={['$ npx expo install firebase']} />

[Firebase Console](http://console.firebase.google.com/) provides you with an API key, and other identifiers for your project needed for initialization. [firebase-web-start](https://firebase.google.com/docs/database/web/start) has a detailed description of what each field means and where to find them in your console.

```javascript
import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
//import {...} from "firebase/auth";
//import {...} from "firebase/database";
//import {...} from "firebase/firestore";
//import {...} from "firebase/functions";
//import {...} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'api-key',
  authDomain: 'project-id.firebaseapp.com',
  databaseURL: 'https://project-id.firebaseio.com',
  projectId: 'project-id',
  storageBucket: 'project-id.appspot.com',
  messagingSenderId: 'sender-id',
  appId: 'app-id',
  measurementId: 'G-measurement-id',
};

let myApp = initializeApp(firebaseConfig);
```

### Temporarily Bypass Default Security Rules

By default Firebase Realtime Database (RTDB) has a security rule setup such that all devices accessing your data must be authenticated. We obviously haven't setup any authentication yet, so we can disable it for now while we setup the rest of our app.

Go into Firebase Console >> _Realtime Database_, and under the Rules tab you should see a default set of rules already provided for you. Change the rules to:

```javascript
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

[See Sample RTDB Rules](https://firebase.google.com/docs/database/security/quickstart#sample-rules) for good sets of rules for your data, including unauthenticated.

> **Note** It is important to note that this is temporary for development, and these rules should be thoroughly assessed before releasing an application.

## Storing Data and Receiving Updates

Storing data through Firebase RTDB is pretty simple. Imagine we're creating a game where highscores are stored in RTDB for everyone to see. We could create a `users` bucket that is referenced by each user. Setting their highscore is straightforward:

```javascript
import { getDatabase, ref, onValue, set } from 'firebase/database';

function storeHighScore(userId, score) {
  const db = getDatabase();
  const reference = ref(db, 'users/' + userId);
  set(reference, {
    highscore: score,
  });
}
```

Now let's say we want another client to listen to updates to the high score of a specific user. Firebase allows us to set a listener on a specific data reference and get notified each time there is an update to the data. In the example below, every time a highscore is updated for the given user, it will print it to console.

```javascript
import { getDatabase, ref, onValue } from 'firebase/database';

setupHighscoreListener(userId) {
  const db = getDatabase();
  const reference = ref(db, 'users/' + userId);
  onValue(reference, (snapshot) => {
    const highscore = snapshot.val().highscore;
    console.log("New high score: " + highscore);
  });
}
```

## User Authentication

This was all pretty simple and works fairly out of the box for what Firebase JavaScript SDK provides. There is one caveat however. We skipped the authentication rules for simplicity at the beginning. Firebase SDKs provide authentication methods for developers, so they don't have to reimplement common login systems such as Google or Facebook login.

This includes UI elements in the Web, Android, and iOS SDK versions for Firebase, however, these UI components do not work with React Native and **should not** be called. Thankfully, Firebase gives us ways to authenticate our data access given that we provide user authentication ourselves.

### Login Methods

We can choose different login methods that make sense to our application. The login method choice is orthogonal to the Firebase RTDB access, however, we do need to let Firebase know how we have setup our login system so that it can correctly assign authentication tokens that match our user accounts for data access control. You can use anything you want, roll your own custom login system, or even forego it altogether if all your users can have unrestricted access - though unrestricted access is strongly discouraged and instead Firebase recommends using their [_Anonymous_ authentication provider](https://firebase.google.com/docs/auth/web/anonymous-auth).

### Facebook Login

{/* TODO: Mention third-party facebook packages */}

A common login system many developers opt for is a simple Facebook login that users are already familiar with.

See the Facebook section of our docs for information on how to set this up. This works just as well with Google and [several others](<https://firebase.google.com/docs/reference/android/com/google/firebase/auth/AuthCredential#getProvider()>).

### Tying Sign-In Providers with Firebase

Once you have added Facebook login to your React Native app, we need to adjust the Firebase console to check for it. Go to [Firebase Console](http://console.firebase.google.com/) >> _Authentication_ >> _Sign-In method_ tab to enable Facebook as a sign-in provider.

You can add whichever provider makes sense for you, or even add multiple providers.

### Phone Authentication

To use phone authentication, you'll need the `expo-firebase-recaptcha` package. It provides a reCAPTCHA widget which is necessary to verify that you are not a bot.

Please follow the instructions for the [expo-firebase-recaptcha](/versions/latest/sdk/firebase-recaptcha) package on how to use phone auth.

### Re-enable Data Access Security Rule

We need to re-enable the Data Security Rule in Firebase Console again to check for user authentication. This time our rules will be slightly more complicated.

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

We are now ready to connect the Facebook login code in our app with our Firebase Realtime Database implementation.

```javascript
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  FacebookAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as Facebook from 'expo-facebook';

let myApp = initializeApp(config);

const auth = getAuth(myApp);

// Listen for authentication state to change.
onAuthStateChanged(auth, user => {
  if (user != null) {
    console.log('We are authenticated now!');
  }

  // Do other things
});

async function loginWithFacebook() {
  await Facebook.initializeAsync('<FACEBOOK_APP_ID>');

  const { type, token } = await Facebook.logInWithReadPermissionsAsync({
    permissions: ['public_profile'],
  });

  if (type === 'success') {
    // Build Firebase credential with the Facebook access token.
    const facebookAuthProvider = new FacebookAuthProvider();
    const credential = facebookAuthProvider.credential(token);

    // Sign in with credential from the Facebook user.
    signInWithCredential(auth, credential).catch(error => {
      // Handle Errors here.
    });
  }
}
```

The Facebook login method is similar to what you see in the Facebook login guide, however, the token we receive from a successful login can be passed to the Firebase SDK to provide us with a Firebase credential via `FacebookAuthProvider.credential`. We can then sign-in with this credential via `signInWithCredential`.

The `onAuthStateChanged` event allows us to set a listener when the authentication state has changed, so in our case, when the Facebook credential is used to successfully sign in to Firebase, we are given a user object that can be used for authenticated data access.

### Authenticated Data Updates with Firebase Realtime Database

Now that we have a user object for our authenticated user, we can adapt our previous `storeHighScore()` method to use the uid of the user object as our user reference. Since the `user.uid`'s are generated by Firebase automatically for authenticated users, this is a good way to reference our users bucket.

```javascript
import { getDatabase, ref, set } from 'firebase/database';

function storeHighScore(user, score) {
  if (user != null) {
    const database = getDatabase();
    set(ref(db, 'users/' + user.uid), {
      highscore: score,
    });
  }
}
```

## Using Expo with Firestore

[Firestore](https://firebase.google.com/docs/firestore/) a second database service in Firebase, the other being Realtime Database. Realtime Database can be thought of as a "JSON tree in the cloud" where your app can listen to and modify different portions of the tree. On the other hand, Firestore is a "document store" database. Your application will store and retrieve entire "documents" at a time, where a "document" is essentially a JavaScript object. Each have their advantages, and sometimes applications will end up using both. See [the comparison chart](https://firebase.google.com/docs/firestore/rtdb-vs-firestore) and [take the survey](https://firebase.google.com/docs/firestore/rtdb-vs-firestore#key_considerations).

Here's is an example of storing a document named "mario" inside of a collection named "characters" in Firestore:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = { ... }  // apiKey, authDomain, etc. (see above)

let myApp = initializeApp(firebaseConfig);

const firestore = getFirestore(myApp);

await setDoc(doc(firestore, "characters", "mario"), {
  employment: "plumber",
  outfitColor: "red",
  specialAttack: "fireball"
});
```

This sample was borrowed and edited from [this forum post](https://forums.expo.dev/t/open-when-an-expo-firebase-firestore-platform/4126/29).

## Recording events with Analytics

In order to record analytics events, the Expo Firebase Core and Analytics packages needs to be installed.

<Terminal cmd={['$ npx expo install expo-firebase-analytics']} />

This package uses a JavaScript-based implementation in Expo Go, and the native Firebase SDK everywhere else.

To configure native Firebase, please follow the configuration instructions for the [`expo-firebase-analytics`](/versions/latest/sdk/firebase-analytics) package.

```javascript
import * as Analytics from 'expo-firebase-analytics';

Analytics.logEvent('hero_spotted', {
  hero_name: 'Saitama',
});
```
