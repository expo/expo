# Stack header and toolbar

## Directory structure

├── **tests**
├── common-primitives.tsx
├── index.tsx
├── screen # Stack.Screen._ components
├── shared.ts # Shared logic for converting Stack.Toolbar props to react-native-screens header items
├── StackHeaderComponent.tsx # Stack.Header
├── StackScreen.tsx # Stack.Screen
├── StackSearchBar.tsx # Stack.SearchBar
└── toolbar # Stack.Toolbar._ components

## Testing

All the tests for the stack header and toolbar are located in the `__tests__` folder. There are two types of tests:

- **Unit tests**: focusing on a simple functionality, but testing every edge case.
- **Integration tests**: testing the integration for example the toolbar with the stack header.

All components should have both unit and integration tests.

Example test separation for Stack.Toolbar.Button:

- unit tests:

  - testing `convertStackToolbarButtonPropsToRNHeaderItem` function
  - testing `StackToolbarButton` rendering `RouterToolbarItem` mock with correct props

- Integration tests:
  - testing if `Stack.Toolbar.Button` rendered inside `Stack.Toolbar` with placement `left` sets correct options on `ScreenStackItem` mock (from `react-native-screens`)
  - testing if `Stack.Toolbar` with placement `bottom` renders correctly within the screen

### Unit tests

- Should test the alignment with docs - we should check if all the props mentioned in the docs are covered
- Should test edge cases for each prop
- Should test the different combinations of props
- Should test all the warnings and errors

The unit tests should be placed in the files indicating the component they are testing. For example, the unit tests for `Stack.Toolbar.Button` should be in `StackToolbarButton.test.ios.tsx`.

### Integration tests

- Should utilize `renderRouter` to render a full navigation tree.
- Should mock `react-native-screens` API - `jest.mock('react-native-screens', () => { ... })`.
- Should mock `NativeToolbarItem`
- Should test the number of (re)renders when props change or on initial render.

The integration tests should be placed in a single `StackToolbar.integration.test.ios.tsx` file.

## Testing Patterns

### Boolean props

Use `it.each([true, false, undefined])` for boolean props to test explicit enable, explicit disable, and default behavior:

```typescript
it.each([true, false, undefined])('handles disabled=%s', (disabled) => {
  const result = convertProps({ disabled });
  expect(result.disabled).toBe(disabled ?? false); // or whatever the default is
});
```

### Placement-based testing

Use `it.each` when testing components that behave differently based on placement:

```typescript
it.each(['left', 'right'] as const)('handles %s placement', (placement) => {
  const result = processToolbar({ placement });
  const itemsKey = placement === 'left' ? 'headerLeftItems' : 'headerRightItems';
  expect(result[itemsKey]).toBeDefined();
});
```

### Props transformation awareness

`react-navigation` transforms option names internally before they reach `react-native-screens`. Check the `react-navigation` `useHeaderConfig` source code to ensure correct prop names are tested.
