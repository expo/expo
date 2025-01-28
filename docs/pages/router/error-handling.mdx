---
title: Error handling
description: Learn how to handle unmatched routes and errors in your app when using Expo Router.
---

import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

This guide specifies how to handle unmatched routes and errors in your app when using Expo Router.

## Unmatched routes

<ContentSpotlight
  alt="An example of unmatched routes displayed on all platforms."
  src="/static/images/expo-router/unmatched.png"
  className="max-w-[720px]"
/>

Native apps don't have a server so there are technically no 404s. However, if you're implementing a router universally, then it makes sense to handle missing routes. This is done automatically for each app, but you can also customize it.

```tsx app/+not-found.tsx
import { Unmatched } from 'expo-router';
export default Unmatched;
```

This will render the default `Unmatched`. You can export any component you want to render instead. We recommend having a link to `/` so users can navigate back to the home screen.

## Error handling

Expo Router enables fine-tuned error handling to enable a more opinionated data-loading strategy in the future.

<ContentSpotlight
  alt="Using ErrorBoundary in Expo Router to catch errors in a route component."
  src="/static/images/expo-router/error-boundaries.png"
  className="max-w-[720px]"
/>

You can export a nested [`ErrorBoundary`](/versions/latest/sdk/router/#errorboundary) component from any route to intercept and format component-level errors using [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary):

{/* prettier-ignore */}
```tsx app/home.tsx
import { View, Text } from 'react-native';
import { type ErrorBoundaryProps } from 'expo-router';

/* @info */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
/* @end */
  return (
    <View style={{ flex: 1, backgroundColor: "red" }}>
      <Text>{error.message}</Text>
      <Text onPress={retry}>Try Again?</Text>
    </View>
  );
}

export default function Page() { ... }
```

When you export an `ErrorBoundary` the route will be wrapped with a React Error Boundary effectively:

```tsx Virtual
function Route({ ErrorBoundary, Component }) {
  return (
    <Try catch={ErrorBoundary}>
      <Component />
    </Try>
  );
}
```

When `ErrorBoundary` is not present, the error will be thrown to the nearest parent's `ErrorBoundary` and accepts [`error`](/versions/latest/sdk/router/#error) and [`retry`](/versions/latest/sdk/router/#retry) props.

### Work in progress

React Native LogBox needs to be presented less aggressively to develop with errors. Currently, it shows for `console.error` and `console.warn`. However, it should ideally only show for uncaught errors.
