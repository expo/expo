# 📦 expo-dev-menu

Expo/React Native module to add developer menu to Debug builds of your application. This package is intended to be included in your project through [`expo-dev-client`](https://docs.expo.dev/develop/development-builds/introduction/#what-is-an-expo-dev-client).

## Documentation

You can find more information in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction).

### Custom icons and groups

Custom items can optionally include a native icon and a section heading:

```ts
import { registerDevMenuItems } from 'expo-dev-menu';
import { router } from 'expo-router';

await registerDevMenuItems([
  {
    name: 'Preview welcome',
    group: 'Previews',
    icon: { ios: 'sparkles', android: 'dev_menu_preview' },
    callback: () => router.push('/welcome'),
    shouldCollapse: true,
  },
]);
```

The iOS icon is an SF Symbol name. Android uses a drawable resource bundled with the development
client, such as `android/app/src/main/res/drawable/dev_menu_preview.xml`. Adding or changing a native
drawable requires rebuilding the client. A missing Android resource, or an omitted platform icon,
leaves the item without an icon. These are monochrome icons tinted by the menu.

Groups appear in first-seen order; items retain registration order within each group. Blank or omitted
groups use the default section, preserving the existing ungrouped appearance. Names must be unique
across all groups because callbacks are identified by name. Registering again replaces all custom
items; passing `[]` clears them.

## Contributing

The Dev Menu UI is built with native platform UI toolkits:

- **iOS**: SwiftUI (see `ios/SwiftUI/`)
- **Android**: Jetpack Compose (see `android/src/debug/java/expo/modules/devmenu/compose/`)

Local development is usually done through [`bare-expo`](/apps/bare-expo). Recompile `bare-expo` after making changes to the native code.

The **Dev Menu** screen in `native-component-list` exercises grouped items, legacy items, callbacks,
and clearing registrations. Run JavaScript tests with `pnpm --filter expo-dev-menu test`. Swift tests
are included in the pod's `Tests` spec used by `apps/native-tests`. Android UI unit tests run with
`./gradlew :expo-dev-menu:testDebugUnitTest` from `apps/bare-expo/android`.
