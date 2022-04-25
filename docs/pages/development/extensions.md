---
title: Extensions
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

Extensions allow you to extend your development client with additional capabilities.

### EAS Updates

<ImageSpotlight alt="An example list of EAS Updates that can be loaded in the expo-dev-client" src="/static/images/dev-client/eas-updates-screen.png" containerStyle={{ paddingBottom: 0 }} />

The EAS Updates extension provides the ability to view and load published updates in your development client.

It's now available for all development clients `v0.9.0` and above. In order to install it, you'll need the most recent publish of expo updates from npm:

```
expo install expo-dev-client@next expo-updates@next
```

#### Configure EAS Update

If you have not yet configured EAS Updates in your project, you can find [additional instructions on how to do so here.](/eas-update/getting-started/)

That's it! You can now view and load EAS Updates in your development build via the `Extensions` panel.
