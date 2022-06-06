---
title: Extensions
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

Extensions allow you to extend your development client with additional capabilities.


### Extending the dev menu

The dev menu can be extended to include extra buttons by using the `registerDevMenuItems` API:

```tsx
import { registerDevMenuItems } from 'expo-dev-menu'

const devMenuItems = [
  {
    name: 'My Custom Button',
    callback: () => console.log("Hello world!")
  }
]

registerDevMenuItems(devMenuItems)
```

This will create a new section in the dev menu that includes the buttons you have registered: 

<ImageSpotlight alt="An example of a custom menu button in expo-dev-menu" src="/static/images/dev-client/custom-menu-button.png" containerStyle={{ paddingBottom: 0 }} />

*Note: Subsequent calls of `registerDevMenuItems` will override previous all entries.*


### EAS Updates

<ImageSpotlight alt="An example list of EAS Updates that can be loaded in the expo-dev-client" src="/static/images/dev-client/eas-updates-screen.png" containerStyle={{ paddingBottom: 0 }} />

The EAS Updates extension provides the ability to view and load published updates in your development client.

It's now available for all development clients `v0.9.0` and above. In order to install it, you'll need the most recent publish of expo updates from npm:

```
expo install expo-dev-client@0.9 expo-updates@next
```

#### Configure EAS Update

If you have not yet configured EAS Updates in your project, you can find [additional instructions on how to do so here.](/eas-update/getting-started/)

That's it! You can now view and load EAS Updates in your development build via the `Extensions` panel.
