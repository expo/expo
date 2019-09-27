---
title: Branch
---

Expo includes alpha support for [Branch](https://branch.io/) attribution services on iOS.

> **Note:** This API only works with standalone iOS builds created with [expo build:ios](../../distribution/building-standalone-apps/).

> **Android Support:** This module is currently not supported on standalone Android builds built with SDK33. If you'd like to use Branch in your Android app, we recommend that you upgrade to SDK34+ or use the [bare workflow](../../../latest/bare/hello-world/) and install the `react-native-branch` module separately. If you previously used Branch in a managed Expo Android app and would like to continue using it as before, you can build your app locally using an older version of [`turtle-cli`](../../../latest/distribution/turtle-cli/) or `expokit`. More details in [this blog post](https://blog.expo.io/changes-to-expo-branch-support-d002c4bc564e).

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. In a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, you should use [react-native-branch-deep-linking](https://github.com/BranchMetrics/react-native-branch-deep-linking) instead.

## Usage

## Importing Branch

The Branch SDK currently lives under Expo's **DangerZone** namespace because it's in a place where it might change significantly. You can import it like this:

```javascript
import { DangerZone } from 'expo';
let { Branch } = DangerZone;
```

## Configuration (standalone apps only)

- Add the **Branch Key** to your `app.json` in the section `android.config.branch.apiKey` and `ios.config.branch.apiKey`. You can find your key on [this page](https://dashboard.branch.io/account-settings/app) of the Branch Dashboard.
- Add a **linking scheme** to your `app.json` in the `scheme` section if you don't already have one.

### Enable Branch support for universal links (iOS only)

Branch can track universal links from domains you associate with your app. **Note:** Expo won't forward these to your JS via the normal Linking API.

- Enable associated domains on [Apple's Developer Portal](https://developer.apple.com/account/ios/identifier/bundle) for your app id. To do so go in the `App IDs` section and click on your app id. Select `Edit`, check the `Associated Domains` checkbox and click `Done`.

- Enable Universal Links in the [Link Settings](https://dashboard.branch.io/link-settings) section of the Branch Dashboard and fill in your Bundle Identifier and Apple App Prefix.

- Add an associated domain to support universal links to your `app.json` in the `ios.associatedDomains` section. This should be in the form of `applinks:<link-domain>` where `link-domain` can be found in the Link Domain section of the [Link Settings](https://dashboard.branch.io/link-settings) page on the Branch Dashboard.

## Using the Branch API

We pull in the API from [react-native-branch](https://github.com/BranchMetrics/react-native-branch-deep-linking#usage), so the documentation there is the best resource to follow. Make sure you import Branch using the above instructions (from `DangerZone.Branch`).

## Example

Listen for links:

```javascript
DangerZone.Branch.subscribe((bundle) => {
  if (bundle && bundle.params && !bundle.error) {
  	// `bundle.params` contains all the info about the link.
  }
});
```

Open a share dialog:

```javascript
class ArticleScreen extends Component {
  componentDidMount() {
    this.createBranchUniversalObject();
  }

  async createBranchUniversalObject() {
    const { article } = this.props;

    this._branchUniversalObject = await DangerZone.Branch.createBranchUniversalObject(
      `article_${article.id}`,
      {
        title: article.title,
        contentImageUrl: article.thumbnail,
        contentDescription: article.description,
        // This metadata can be used to easily navigate back to this screen
        // when implementing deep linking with `Branch.subscribe`.
        metadata: {
          screen: 'articleScreen',
          params: JSON.stringify({ articleId: article.id }),
        },
      }
    );
  }

  onShareLinkPress = async () => {
    const shareOptions = {
      messageHeader: this.props.article.title,
      messageBody: `Checkout my new article!`,
    };
    await this._branchUniversalObject.showShareSheet(shareOptions);
  };
}
```

#