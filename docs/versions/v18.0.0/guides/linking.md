---
title: Linking
---

## Introduction

Every good website is prefixed with `https://`, and `https` is what is known as a *URL scheme*. Insecure websites are prefixed with `http://`, and `http` is the URL scheme. Let's call it scheme for short.

To navigate from one website to another, you can use an anchor tag (`<a>`) on the web. You can also use JavaScript APIs like `window.history` and `window.location`.

In addition to `https`, you're likely also familiar with the `mailto` scheme. When you open a link with the `mailto` scheme, your operating system will open an installed mail application. If you have more than one mail application installed then your operating system may prompt you to pick one. Similarly, there are schemes for making phone calls and sending SMS'. Read more about [built-in URL schemes](#built-in-url-schemes) below.

`https` and `http` are handled by your browser, but it's possible to link to other applications by using different url schemes. For example, when you get a "Magic Link" email from Slack, the "Launch Slack" button is an anchor tag with an href that looks something like: `slack://secret/magic-login/other-secret`. Like with Slack, you can tell the operating system that you want to handle a custom scheme. Read more about [configuring a scheme](#in-a-standalone-app). When the Slack app opens, it receives the URL that was used to open it and can then act on the data that is made available through the url -- in this case, a secret string that will log the user in to a particular server. This is often referred to as **deep linking**. Read more about [handling deep links into your app](#handling-links-into-your-app).

Deep linking with scheme isn't the only linking tool available to you -- we are working on adding support for universal links on iOS, and we support deferred deep links with [Branch](../sdk/branch.html) already.  We will update this documentation with more information in future SDKs.

## Linking from your app to other apps

### Built-in URL Schemes

As mentioned in the introduction, there are some URL schemes for core functionality that exist on every platform. The following is a non-exhaustive list, but covers the most commonly used schemes.

| Scheme                | Description                                       | iOS | Android
|-----------------------| --------------------------------------------------|-----|---------
| `mailto`              | Open mail app, eg: `mailto: support@expo.io`      | ✅   | ✅
| `tel`                 | Open phone app, eg: `tel:+123456789`              | ✅   | ✅
| `sms`                 | Open SMS app, eg: `sms:+123456789`                | ✅   | ✅
| `https` / `http`      | Open web browser app, eg: `https://expo.io`       | ✅   | ✅


### Opening links from your app

There is no anchor tag in React Native, so we can't write `<a href="https://expo.io">`, instead we have to use `Linking.openURL`.

```javascript
import { Linking } from 'react-native';

Linking.openURL('https://expo.io');
```

Usually you don't open a URL without it being requested by the user -- here's an example of a simple `Anchor` component that will open a URL when it is pressed.

```javascript
import { Linking, Text } from 'react-native';

export default class Anchor extends React.Component {
  handlePress = () => {
    Linking.openURL(this.props.href);
    this.props.onPress && this.props.onPress();
  };

  render() {
    return (
      <Text {...this.props} onPress={this._handlePress}>
        {this.props.children}
      </Text>
    );
  }
}

// <Anchor href="https://google.com">Go to Google</Anchor>
// <Anchor href="mailto://support@expo.io">Go to Google</Anchor>
```

### Using `Expo.WebBrowser` instead of `Linking` for opening web links

The following example illustrates the difference between opening a web link with `Expo.WebBrowser.openBrowserAsync` and React Native's `Linking.openURL`. Often `WebBrowser` is a better option because it's a modal within your app and users can easily close out of it and return to your app.

![sketch](H11a8rk7b)

### Opening links to other apps

If you know the custom scheme for another app you can link to it. Some services provide documentation for deep linking, for example the [Lyft deep linking documentation](https://developer.lyft.com/v1/docs/deeplinking) describes how to link directly to a specific pickup location and destination:

```
lyft://ridetype?id=lyft&pickup[latitude]=37.764728&pickup[longitude]=-122.422999&destination[latitude]=37.7763592&destination[longitude]=-122.4242038
```

It's possible that the user doesn't have the Lyft app installed, in which case you may want to open the App / Play Store, or let them know that they need to install it first. We recommend using the library [react-native-app-link](https://github.com/fiber-god/react-native-app-link) for these cases.

## Linking to your app

### In the Expo client

Before continuing it's worth taking a moment to learn how to link to your app within the Expo client. The Expo client uses the `exp://` scheme, but if we link to `exp://` without any address afterwards, it will open the app to the main screen.

In development, your app will live at a url like `exp://wg-qka.community.app.exp.direct:80`. When it's deployed, it will be at a URL like `exp://exp.host/@community/with-webbrowser-redirect`.  If you create a website with a link like `<a href="exp://expo.io/@community/with-webbrowser-redirect">Open my project</a>`, then open that site on your device and click the link, it will open your app within the Expo client. You can link to it from another app by using `Linking.openURL` too.

### In a standalone app

To link to your standalone app, you need to specify a scheme for your app. You can register for a scheme in your `app.json` by adding a string under the `scheme` key:

```
{
  "expo": {
    "scheme": "myapp"
  }
}
```

Once you build your standalone app and install it to your device, you will be able to open it with links to `myapp://`.

### `Expo.Constants.linkingUri`

To save you the trouble of inserting a bunch of conditionals based on the environment that you're in and hardcoding urls, we provide the `linkingUri` constant. When you want to provide a service with a url that it needs to redirect back into your app, you can use this and it will resolve to the following:

- *Published app in Expo client*: `exp://exp.host/@community/with-webbrowser-redirect/+`
- *Published app in standalone*: `myapp://+`
- *Development*: `exp://wg-qka.community.app.exp.direct:80/+`

You will notice that at the end of each URL there is a `/+` -- anything after the `/+` is to be used by your app to receive data, which we will talk about in the next section.

### Handling links into your app

There are two ways to handle URLs that open your app.

#### 1. If the app is already open, the app is foregrounded and a Linking event is fired

You can handle these events with `Linking.addEventListener('url', callback)`.

#### 2. If the app is not already open, it is opened and the url is passed in as the initialURL

You can handle these events with `Linking.getInitialURL` -- it returns a `Promise` that resolves to the url, if there is one.

See the examples below to see these in action.

### Passing data to your app through the URL

If I want to pass some data into my app, I can append it as a query string on the end of the `Constants.linkingUri`. You can then parse the query string with something like [qs](https://www.npmjs.com/package/qs).

When [handling the URL that is used to open/foreground your app](#handling-urls-in-your-app), it would look something like this:

```javascript
_handleUrl = (url) => {
  this.setState({ url });
  let queryString = url.replace(Constants.linkingUri, '');
  if (queryString) {
    let data = qs.parse(queryString);
    alert(`Linked to app with data: ${JSON.stringify(data)}`);
  }
}
```

If you opened a URL like
`${Constants.linkingUri}?hello=world&goodbye=now`, this would alert
`{hello: 'world', goodbye: 'now'}`.

### Example: linking back to your app from WebBrowser

The example project [examples/with-webbrowser-redirect](https://github.com/expo/examples/tree/master/with-webbrowser-redirect) demonstrates handling redirects from `WebBrowser` and taking data out of the query string. [Try it out in Expo](https://expo.io/@community/with-webbrowser-redirect).

### Example: using linking for authentication

A common use case for linking to your app is to redirect back to your app after opening a [WebBrowser](../sdk/webbrowser.html). For example, you can open a web browser session to your sign in screen and when the user has successfully signed in, you can have your website redirect back to your app by using the scheme and appending the authentication token and other data to the URL.

**Note**: if try to use `Linking.openURL` to open the web browser for authentication then your app may be rejected by Apple on the grounds of a bad or confusing user experience. `WebBrowser.openBrowserAsync` opens the browser window in a modal, which looks and feels good and is Apple approved.

To see a full example of using `WebBrowser` for authentication with Facebook, see [examples/with-facebook-auth](https://github.com/expo/examples/tree/master/with-facebook-auth).  Currently Facebook authentication requires that you deploy a small webserver to redirect back to your app (as described in the example) because Facebook does not let you redirect to custom schemes, Expo is working on a solution to make this easier for you. [Try it out in Expo](https://expo.io/@community/with-facebook-auth).

Another example of using `WebBrowser` for authentication can be found at [expo/auth0-example](https://github.com/expo/auth0-example).

## When to *not* use deep links

This is the easiest way to set up deep links into your app because it requires a minimal amount of configuration.

The main problem is that if the user does not have your app installed and follows a link to your app with its custom scheme, their operating system will indicate that the page couldn't be opened but not give much more information. This is not a great experience. There is no way to work around this in the browser.

Additionally, many messaging apps do not autolink URLs with custom schemes -- for example, `exp://exp.host/@community/native-component-list` might just show up as plain text in your browser rather than as a link ([exp://exp.host/@community/native-component-list](exp://exp.host/@community/native-component-list)).
