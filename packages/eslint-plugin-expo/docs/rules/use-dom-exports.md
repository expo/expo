# Only allow supported exports from files marked with the "use dom" directive

Expo [DOM Components](https://docs.expo.dev/guides/dom-components/) are created by marking a file with a "use dom" directive at the top and exporting a React component as default.

This component will be rendered in a WebView inside the native app and a standard component on web.

No other exports are allowed with exception for TypeScript types.

## Rule Details

This rule ensures that only valid exports are used in files marked with the "use dom" directive, preventing potential runtime errors or unexpected behavior.

### Examples of **incorrect** code:

```js
'use dom';

// Exporting non-TypeScript types or additional variables
export const myVar = 'This is not allowed';

export default function MyComponent() {
  return <div>Hello, world!</div>;
}
```

### Examples of **correct** code:

```js
"use dom";

// Only exporting the default React component and TypeScript types
export default function MyComponent() {
    return <div>Hello, world!</div>;
}

// TypeScript type exports are allowed
export type MyComponentProps = {
    title: string;
};
```

## When Not To Use It

This rule is unnecessary if you are not using the "use dom" directive or Expo DOM Components in your app.

## Further Reading

- [Expo DOM Components Documentation](https://docs.expo.dev/guides/dom-components/)
