---
title: Widgets
description: A library to build iOS home screen widgets and Live Activities using Expo UI components.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-widgets'
packageName: 'expo-widgets'
exampleName: 'with-widgets'
platforms: ['ios']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';
import { ConfigPluginExample, ConfigPluginProperties } from '~/ui/components/ConfigSection';

> **important** This library is not available in the Expo Go app — use [development builds](/develop/development-builds/introduction) to try it out.

`expo-widgets` enables the creation of iOS home screen widgets and Live Activities using Expo UI components, without writing native code. It provides a simple API for creating and updating a widget's timeline, as well as starting and managing Live Activities. You can build the layout using [`expo/ui`](/versions/latest/sdk/ui/swift-ui/) components and modifiers.

## Known limitations

- **Frequent Live Activity updates.** To raise the budget for frequent push updates, set `NSSupportsLiveActivitiesFrequentUpdates` to `true` in your **Info.plist**. The system may still throttle updates, and the user can disable frequent updates in Settings.
- **Widget runtime.** Code inside a `'widget'`-marked component runs in an isolated runtime and can only use `@expo/ui/swift-ui` components, with no React hooks, app state, or asynchronous work. See [The `'widget'` directive](#the-widget-directive).

## Installation

<APIInstallSection />

## Configuration in app config

You can configure `expo-widgets` using its built-in [config plugin](/config-plugins/introduction/) if you use config plugins in your project ([Continuous Native Generation (CNG)](/workflow/continuous-native-generation/)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

<ConfigPluginExample>

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "widgets": [
            {
              "name": "MyWidget",
              "displayName": "My Widget",
              "description": "A sample home screen widget",
              "ios": {
                "supportedFamilies": ["systemSmall", "systemMedium", "systemLarge"]
              }
            }
          ]
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties
  properties={[
    {
      name: 'bundleIdentifier',
      description:
        'The bundle identifier for the widget extension target. If not specified, defaults to `<main app bundle identifier>.ExpoWidgetsTarget`.',
      default: '"<app bundle identifier>.ExpoWidgetsTarget"',
    },
    {
      name: 'groupIdentifier',
      description:
        'The app group identifier used for communication and data sharing between the main app and widgets, which widgets require to work. If not specified, it defaults to `group.<main app bundle identifier>`. If `ios.bundleIdentifier` is also unset, prebuild fails because the bundle identifier is required to derive this value.',
      default: '"group.<app bundle identifier>"',
    },
    {
      name: 'enablePushNotifications',
      description:
        'Whether to enable push notifications for Live Activities. When enabled, this adds the `aps-environment` entitlement and sets `ExpoLiveActivity_EnablePushNotifications` in the **Info.plist**.',
      default: 'false',
    },
    {
      name: 'widgets',
      description:
        'An array of widget configurations. Each widget in the array will be generated as a separate widget kind in your widget extension.',
    },
    {
      name: 'widgets[].name',
      description:
        'The internal name (identifier) of the widget. This is used as the Swift struct name and should be a valid Swift identifier (no spaces or special characters). It must match the `name` passed to `createWidget`.',
    },
    {
      name: 'widgets[].displayName',
      description:
        'The user-facing name of the widget that appears in the widget gallery when users add widgets to their home screen.',
    },
    {
      name: 'widgets[].description',
      description:
        "A brief description of what the widget does. This appears in the widget gallery to help users understand the widget's purpose.",
    },
    {
      name: 'widgets[].ios.supportedFamilies',
      description: [
        'An array of widget sizes that this widget supports. Available options:',
        '* `systemSmall` - Small square widget (2x2 grid)',
        '* `systemMedium` - Medium rectangular widget (4x2 grid)',
        '* `systemLarge` - Large square widget (4x4 grid)',
        '* `systemExtraLarge` - Extra large widget (iPad only, 6x4 grid)',
        '* `accessoryCircular` - Circular widget for Lock Screen',
        '* `accessoryRectangular` - Rectangular widget for Lock Screen',
        '* `accessoryInline` - Inline text widget for Lock Screen',
      ].join('\n'),
    },
    {
      name: 'widgets[].ios.contentMarginsDisabled',
      description:
        "When you disable content margins for a widget, the system doesn't automatically add margins around the widget's content, and you are responsible for specifying margins and padding around your widget content for each context.",
      default: 'false',
    },
    {
      name: 'widgets[].ios.initialLayout',
      description:
        'A path to the file that registers this widget with `createWidget`. The path is relative to the project root. Set this so the widget appears in the widget gallery before the app is open for the first time.',
    },
    {
      name: 'widgets[].ios.configuration',
      description: [
        'Makes the widget [configurable](#configurable-widgets). The values the user picks are passed to your widget at runtime through `environment.configuration`. An object with:',
        '* `title` - The title shown when the user edits the widget.',
        '* `description` - An optional description shown when the user edits the widget.',
        '* `parameters` - A map of parameter keys to parameter definitions. Each parameter has a `title`, a `type` (`string`, `number`, `boolean`, or `enum`), and a `default`. An `enum` parameter additionally takes a `values` array of `{ name, value }` options.',
      ].join('\n'),
    },
  ]}
/>

> **info** The top-level `supportedFamilies` and `contentMarginsDisabled` options are deprecated aliases for `ios.supportedFamilies` and `ios.contentMarginsDisabled`. Prefer the nested `ios` form shown above.

### Full example with all options

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "bundleIdentifier": "com.example.myapp.widgets",
          "groupIdentifier": "group.com.example.myapp",
          "enablePushNotifications": true,
          "widgets": [
            {
              "name": "StatusWidget",
              "displayName": "Status",
              "description": "Shows your current status at a glance",
              "ios": {
                "contentMarginsDisabled": true,
                "supportedFamilies": ["systemSmall", "systemMedium"]
              }
            },
            {
              "name": "WeatherWidget",
              "displayName": "Weather",
              "description": "Shows the weather for a city you choose",
              "ios": {
                "supportedFamilies": ["systemSmall", "systemMedium"],
                "configuration": {
                  "title": "Choose a city",
                  "description": "Pick which city to show the weather for",
                  "parameters": {
                    "city": {
                      "title": "City",
                      "type": "enum",
                      "default": "sf",
                      "values": [
                        { "name": "San Francisco", "value": "sf" },
                        { "name": "New York", "value": "nyc" }
                      ]
                    }
                  }
                }
              }
            },
            {
              "name": "LockScreenWidget",
              "displayName": "Quick View",
              "description": "View info on your Lock Screen",
              "ios": {
                "supportedFamilies": [
                  "accessoryCircular",
                  "accessoryRectangular",
                  "accessoryInline"
                ]
              }
            }
          ]
        }
      ]
    ]
  }
}
```

## Usage

### The `'widget'` directive

Components passed to `createWidget` and `createLiveActivity` must start with the `'widget'` directive. The directive tells the bundler to compile that component into a separate JavaScript bundle that runs in an isolated runtime inside the widget extension, not in your app's React Native runtime.

Because of this isolation, code inside a `'widget'`-marked component is limited:

- It can only render [`@expo/ui/swift-ui`](/versions/latest/sdk/ui/swift-ui/) components and modifiers. Standard React Native components (such as `View` and `Text` from `react-native`) are not available.
- It cannot use React hooks (`useState`, `useEffect`, and others), component state, or context. The function must be pure and return its layout synchronously.
- It cannot perform asynchronous work, import other modules, or access your app's runtime or in-memory state.
- It cannot reference anything declared outside the component function, including plain top-level `const`s in the **same file**. The bundler serializes only the function body, so module-scope values are not present at runtime. Declare every constant and helper **inside** the widget function, or pass it in through props.

All data a widget needs must come in through its props (set with `updateSnapshot`, `updateTimeline`, or a Live Activity's `start` and `update`) and the `environment` argument. To use images, write them to [`widgetsDirectory`](#sharing-images-with-widgetsdirectory) from your app and reference them by path.

```tsx
import { Text } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Declared at module scope — not included in the widget bundle.
const CITY_NAMES: Record<string, string> = { sf: 'San Francisco' };

const CityWidget = (props: object, environment: WidgetEnvironment<{ city: string }>) => {
  'widget';
  // Throws at runtime: Can't find variable: CITY_NAMES
  return <Text>{CITY_NAMES[environment.configuration.city]}</Text>;
};

export default createWidget('CityWidget', CityWidget);
```

Move `CITY_NAMES` inside `CityWidget` (or pass the resolved value through props) to fix it.

### Widgets

#### Prerequisite: Creating a widget

Start by creating a widget using the `createWidget` function and pass the widget component marked with the `'widget'` directive. The component receives your widget props as the first argument and a `WidgetEnvironment` object as the second.

```tsx
import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type MyWidgetProps = {
  count: number;
};

const MyWidget = (props: MyWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  return (
    <VStack>
      <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle('#000000')]}>
        Count: {props.count}
      </Text>
      <Text>Family: {environment.widgetFamily}</Text>
    </VStack>
  );
};

export default createWidget('MyWidget', MyWidget, { count: 0 });
```

The widget name (`'MyWidget'`) must match the `name` field in your widget configuration in the [app config](/workflow/configuration/).
The optional third argument provides the initial props used before the widget timeline is updated.

#### Basic widget

An effective way to update a widget is to use the `updateSnapshot` method. This creates a widget timeline with a single entry that displays immediately.

The example below continues from [Creating a widget](#prerequisite-creating-a-widget).

```tsx
import MyWidget from './MyWidget';

// Update the widget
MyWidget.updateSnapshot({ count: 5 });
```

#### Timeline widget

Use the `updateTimeline` method to schedule widget updates at a specific time. The system automatically updates the widget based on the timeline.

The example below continues from [Creating a widget](#prerequisite-creating-a-widget).

```tsx
import MyWidget from './MyWidget';

MyWidget.updateTimeline([
  { date: new Date(), props: { count: 1 } },
  { date: new Date(Date.now() + 3600000), props: { count: 2 } }, // 1 hour from now
  { date: new Date(Date.now() + 7200000), props: { count: 3 } }, // 2 hours from now
  { date: new Date(Date.now() + 10800000), props: { count: 4 } }, // 3 hours from now
]);
```

#### Reading the current timeline

Use `getTimeline` to read the entries currently scheduled for a widget, including past and future entries.

```tsx
import MyWidget from './MyWidget';

const entries = await MyWidget.getTimeline();
// [{ date: Date, props: { count: number } }, ...]
```

#### Reloading a widget

Use `reload` to force the system to refresh a widget's content and timeline immediately, for example after the underlying data changes.

```tsx
import MyWidget from './MyWidget';

MyWidget.reload();
```

#### Responsive widget

Use the `environment` argument to adapt the layout to the current widget size and rendering context.

```tsx
import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type WeatherWidgetProps = {
  temperature: number;
  condition: string;
};

const WeatherWidget = (props: WeatherWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  // Render different layouts based on size
  if (environment.widgetFamily === 'systemSmall') {
    return (
      <VStack>
        <Text>{props.temperature}°</Text>
      </VStack>
    );
  }

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack>
        <Text>{props.temperature}°</Text>
        <Text>{props.condition}</Text>
      </HStack>
    );
  }

  // systemLarge and others
  return (
    <VStack>
      <Text>Temperature: {props.temperature}°</Text>
      <Text>Condition: {props.condition}</Text>
      <Text>Updated: {environment.date.toLocaleTimeString()}</Text>
    </VStack>
  );
};

const Widget = createWidget('WeatherWidget', WeatherWidget);
export default Widget;

Widget.updateSnapshot({
  temperature: 72,
  condition: 'Sunny',
});
```

#### Adapting to the rendering environment

Beyond `widgetFamily` and `date`, the `environment` object describes how and where the system is drawing the widget so you can adapt the layout:

- `colorScheme`: `'light'` or `'dark'`.
- `widgetRenderingMode`: `'fullColor'` for home screen widgets, `'vibrant'` for Lock Screen widgets (the system desaturates them into an adaptive monochrome look), and `'accented'` for tinted widgets on iOS 18 and later. Use this to choose colors that read well in each mode.
- `isLuminanceReduced`: `true` when the display requires reduced brightness (such as Always-On). Lower the overall brightness of your content, for example by using stroked rather than filled shapes.
- `widgetContentMargins`: The system-suggested margins (`top`, `bottom`, `leading`, `trailing`) when content margins are not disabled.
- `showsWidgetLabel`: For accessory widgets, whether an accessory label can be displayed.

#### Interactive widgets

Widgets can include interactive controls such as `Button`. The value a button's `onPress` callback returns becomes the widget's new props. The runtime persists it and reloads the widget on device, with no running app process required. This is the primary way to make a widget update itself in response to a tap. Interactive widgets require iOS 17 or later.

```tsx CounterWidget.tsx
import { Button, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget } from 'expo-widgets';

type CounterProps = {
  count: number;
};

const CounterWidget = (props: CounterProps) => {
  'widget';
  return (
    <VStack>
      <Text>Count: {props.count}</Text>
      <Button label="Increment" target="increment" onPress={() => ({ count: props.count + 1 })} />
    </VStack>
  );
};

export default createWidget('CounterWidget', CounterWidget, { count: 0 });
```

To also keep your running app in sync with widget interactions, give the control a `target` identifier (as above) and listen for taps with `addUserInteractionListener`. The listener receives the widget's `name` as `source` and the control's `target`. Unlike `onPress`, it only fires while the app process is alive, so use it to mirror interactions into app state, not as the widget's update mechanism.

```tsx App.tsx
import { addUserInteractionListener } from 'expo-widgets';

const subscription = addUserInteractionListener(event => {
  if (event.source === 'CounterWidget' && event.target === 'increment') {
    // The widget already updated itself via onPress; mirror the change in app state here.
    console.log('Counter incremented from the widget');
  }
});

// Later, when you no longer need updates:
subscription.remove();
```

#### Sharing images with `widgetsDirectory`

A widget can't access files inside your app's sandbox, so to display an image in a widget you must place it in the shared app group container. `widgetsDirectory` is a `file://` URL string pointing to a directory that both your app and its widgets can read. Write the image there from your app, then reference it by path in the widget.

```tsx
import { widgetsDirectory } from 'expo-widgets';

// `widgetsDirectory` is a file:// URL to a directory shared with your widgets.
console.log(widgetsDirectory);
```

> **info** `widgetsDirectory` is `null` only when no app group is configured. The `groupIdentifier` config plugin option sets one up automatically (falling back to `group.<bundle identifier>`), so it is available in normal use.

#### Configurable widgets

When you add an [`ios.configuration`](#configuration-in-app-config) to a widget, users can long-press the widget and edit its parameters. The values they choose are delivered to your widget through `environment.configuration`. Type the configuration by passing a second type argument to `createWidget` (and `WidgetEnvironment`). Configurable widgets require iOS 17 or later.

```tsx
import { Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type WeatherProps = {
  temperature: number;
};

type WeatherConfiguration = {
  city: string;
};

const WeatherWidget = (
  props: WeatherProps,
  environment: WidgetEnvironment<WeatherConfiguration>
) => {
  'widget';
  return (
    <VStack>
      <Text>{environment.configuration.city}</Text>
      <Text>{props.temperature}°</Text>
    </VStack>
  );
};

export default createWidget<WeatherProps, WeatherConfiguration>('WeatherWidget', WeatherWidget);
```

### Live Activities

Live Activities display real-time information on the Lock Screen and in the Dynamic Island on supported devices.

#### Prerequisite: Creating a Live Activity

Live Activity layouts must be created once using `createLiveActivity` and marked with the `'widget'` directive. The component receives your props as the first argument and a `LiveActivityEnvironment` object as the second. It returns an object describing the layout for each presentation: the Lock Screen `banner`, the compact and minimal Dynamic Island states, and the expanded Dynamic Island regions.

> **important** `createLiveActivity` registers a Live Activity entirely at runtime, and the library's built-in Live Activity target renders it. Do **not** add a `widgets[]` entry for it in the [app config](#configuration-in-app-config). The `widgets[]` array is only for home screen and Lock Screen widgets, and an entry without `supportedFamilies` generates an invalid widget target that fails to build. The `name` you pass to `createLiveActivity` only has to match this `createLiveActivity` call, not an app-config widget.

```tsx
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type DeliveryActivityProps = {
  etaMinutes: number;
  status: string;
};

const DeliveryActivity = (props: DeliveryActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  const accentColor = environment.isLuminanceReduced ? '#FFFFFF' : '#007AFF';

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold' }), foregroundStyle(accentColor)]}>
          {props.status}
        </Text>
        <Text>Estimated arrival: {props.etaMinutes} minutes</Text>
      </VStack>
    ),
    compactLeading: <Image systemName="box.truck.fill" color={accentColor} />,
    compactTrailing: <Text>{props.etaMinutes} min</Text>,
    minimal: <Image systemName="box.truck.fill" color={accentColor} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="box.truck.fill" color={accentColor} />
        <Text modifiers={[font({ size: 12 })]}>Delivering</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 20 })]}>{props.etaMinutes}</Text>
        <Text modifiers={[font({ size: 12 })]}>minutes</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text>Driver: John Smith</Text>
        <Text>Order #12345</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('DeliveryActivity', DeliveryActivity);
```

The layout object supports these regions:

- `banner`: The main Lock Screen presentation.
- `bannerSmall`: A compact Lock Screen presentation used on CarPlay and watchOS. Falls back to `banner` when omitted.
- `compactLeading`, `compactTrailing`, `minimal`: The compact and minimal Dynamic Island states.
- `expandedLeading`, `expandedTrailing`, `expandedCenter`, `expandedBottom`: The regions of the expanded Dynamic Island.

The `environment` object also exposes `isLuminanceReduced`, `isActivityFullscreen`, `isActivityUpdateReduced`, and `activityFamily` so you can adapt the layout to the current presentation.

#### Starting a Live Activity

The example below continues from [Creating a Live Activity](#prerequisite-creating-a-live-activity).

```tsx
import { Button, View } from 'react-native';
import DeliveryActivity from './DeliveryActivity';

function App() {
  const startDeliveryTracking = () => {
    // Start the Live Activity
    const instance = DeliveryActivity.start(
      {
        etaMinutes: 15,
        status: 'Your delivery is on the way',
      },
      'myapp://deliveries/12345'
    );
    // Store instance
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Start Delivery Tracking" onPress={startDeliveryTracking} />
    </View>
  );
}
export default App;
```

The optional second argument is a URL associated with the Live Activity. When the user taps the activity, the system opens your app with that URL, so you can route to the relevant screen using [linking](/linking/into-your-app/) (for example with Expo Router's deep linking).

#### Updating a Live Activity

The example below continues from [Starting a Live Activity](#starting-a-live-activity).

```tsx
import { LiveActivity } from 'expo-widgets';

function updateDelivery(instance: LiveActivity<DeliveryActivityProps>) {
  instance.update({
    etaMinutes: 2,
    status: 'Delivery arriving soon!',
  });
}
```

#### Recovering active Live Activities

A Live Activity can outlive the app process that started it. Use `getInstances` on the factory to retrieve the activities of that type that are currently active, for example to update or end them after your app relaunches.

```tsx
import DeliveryActivity from './DeliveryActivity';

const activeInstances = DeliveryActivity.getInstances();

for (const instance of activeInstances) {
  await instance.update({ etaMinutes: 5, status: 'Almost there' });
}
```

#### Ending a Live Activity

Use `end` to finish a Live Activity. You can choose the dismissal policy, optionally provide a final content state, and pass a `contentDate` so the system can ignore stale updates.

```tsx
import { after, type LiveActivity } from 'expo-widgets';

async function completeDelivery(instance: LiveActivity<DeliveryActivityProps>) {
  await instance.end(
    after(new Date(Date.now() + 15 * 60 * 1000)),
    {
      etaMinutes: 0,
      status: 'Delivered',
    },
    new Date()
  );
}
```

You can also pass `'default'` or `'immediate'` instead of `after(date)` for the dismissal policy.

#### Remote updates with push notifications

When `enablePushNotifications` is `true`, you can update Live Activities remotely from your server through Apple Push Notification service (APNs).

- Use `addPushToStartTokenListener` to receive the app-wide push-to-start token, which lets your server start a Live Activity remotely (requires iOS 17.2 or later).
- Use `instance.getPushToken()` or `instance.addPushTokenListener()` to obtain the token for a specific running Live Activity, which lets your server send updates to that activity.

```tsx
import { addPushToStartTokenListener } from 'expo-widgets';
import DeliveryActivity from './DeliveryActivity';

const pushToStartSubscription = addPushToStartTokenListener(event => {
  console.log('Push-to-start token:', event.activityPushToStartToken);
});

async function startDeliveryTracking() {
  const instance = DeliveryActivity.start({
    etaMinutes: 15,
    status: 'Your delivery is on the way',
  });

  const pushToken = await instance.getPushToken();
  console.log('Per-activity token:', pushToken);

  const subscription = instance.addPushTokenListener(event => {
    console.log('Updated push token:', event.activityId, event.pushToken);
  });

  // Later, when you no longer need updates:
  subscription.remove();
}

// Later, when you no longer need updates:
pushToStartSubscription.remove();
```

Send the token to your server and use it to push updates. The notification must use the `liveactivity` push type (the `apns-push-type` header) and an `apns-topic` of `<your bundle identifier>.push-type.liveactivity`. Its `aps` payload carries an `event` (`start`, `update`, or `end`), a `timestamp`, and a `content-state` that matches your activity's props. The `content-state` must match the internal content state used by `expo-widgets`: set `name` to the name you passed to `createLiveActivity`, and set `props` to a JSON string of that activity's props. Use `apns-priority: 10` for immediate updates and `apns-priority: 5` for lower-priority updates. The `timestamp`, `dismissal-date`, and other APNs date fields are Unix timestamps in seconds.

To start a Live Activity remotely, send a `start` event to the push-to-start token:

```json
{
  "aps": {
    "timestamp": 1778832000,
    "event": "start",
    "attributes-type": "LiveActivityAttributes",
    "attributes": {},
    "content-state": {
      "name": "DeliveryActivity",
      "props": "{\"etaMinutes\":15,\"status\":\"Your delivery is on the way\"}"
    },
    "alert": {
      "title": "Delivery started",
      "body": "Your delivery is on the way"
    }
  }
}
```

Remote start requires iOS 17.2 or later. Include `input-push-token: 1` in the `aps` payload on iOS 18 or later if you want APNs to provide a new per-activity token for future updates.

To update a Live Activity remotely, send an `update` event to that activity's per-activity token:

```json
{
  "aps": {
    "timestamp": 1778832300,
    "event": "update",
    "content-state": {
      "name": "DeliveryActivity",
      "props": "{\"etaMinutes\":2,\"status\":\"Delivery arriving soon!\"}"
    }
  }
}
```

To end a Live Activity remotely, send an `end` event with the final content state:

```json
{
  "aps": {
    "timestamp": 1778832600,
    "event": "end",
    "content-state": {
      "name": "DeliveryActivity",
      "props": "{\"etaMinutes\":0,\"status\":\"Delivered\"}"
    },
    "dismissal-date": 1778833200
  }
}
```

For the exact payload shape and headers, follow Apple's [Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications).

## API

{/* prettier-ignore */}
```tsx
import { createWidget, createLiveActivity } from 'expo-widgets';
```

<APISection packageName="expo-widgets" />
