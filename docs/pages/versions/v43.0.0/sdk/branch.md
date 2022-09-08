---
title: Branch
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-branch'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-branch`** provides support for the [Branch](https://branch.io/) SDK, which is used for install referrals and attribution with deep links. **This module only works in standalone apps &mdash; you will need to [build a standalone app](../../../distribution/building-standalone-apps.md) in order to test it, rather than using Expo Go.**

<PlatformsSection android emulator ios simulator />

## Installation

For [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps, you'll need to run `expo install expo-branch`. In a [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native app, you should use [react-native-branch-deep-linking-attribution](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution) instead.

## Configuration

- Add the **Branch Key** to your **app.json** in the section `android.config.branch.apiKey` and `ios.config.branch.apiKey`. You can find your key on [this page](https://dashboard.branch.io/account-settings/app) of the Branch Dashboard.
- Add a **linking scheme** to your **app.json** in the `scheme` section if you don't already have one.
- On iOS, the `Branch` module will automatically be bundled with your **.ipa**. For Android, `expo-branch` must be present in your dependencies in **package.json** at the time `expo build:android` is run in order for the module to be bundled with your **.apk**.
- For Android, add a new intent filter that registers the Branch `link-domain`, under `android.intentFilters` in **app.json**.

### Enable Branch support for Universal Links (iOS only)

Branch can track universal links from domains you associate with your app. **Note:** Universal Links handled by Branch won't be forwarded to the [Linking](linking.md) module.

- Enable associated domains on [Apple's Developer Portal](https://developer.apple.com/account/resources/identifiers/list) for your app id. To do so go in the `App IDs` section and click on your app id. Select `Edit`, check the `Associated Domains` checkbox and click `Done`.

- Enable Universal Links in the [Link Settings](https://dashboard.branch.io/link-settings) section of the Branch Dashboard and fill in your Bundle Identifier and Apple App Prefix.

- Add an associated domain to support universal links to your **app.json** in the `ios.associatedDomains` section. This should be in the form of `applinks:<link-domain>` where `link-domain` can be found in the Link Domain section of the [Link Settings](https://dashboard.branch.io/link-settings) page on the Branch Dashboard. You will need to rebuild your app for the new associated domain to be picked up.

## Importing Branch

```javascript
import Branch, { BranchEvent } from 'expo-branch';
```

## Using the Branch API

We pull in the API from [react-native-branch-deep-linking-attribution](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution#usage), so the documentation there is the best resource to follow. Make sure you import Branch using the above instructions (from `Branch`).

## Example

Listen for links:

```javascript
Branch.subscribe(bundle => {
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

    this._branchUniversalObject = await Branch.createBranchUniversalObject(
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
