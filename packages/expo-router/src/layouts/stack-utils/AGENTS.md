# Stack header and toolbar

## Directory structure

├── __tests__
├── common-primitives.tsx
├── index.tsx
├── screen # Stack.Screen.* components
├── shared.ts # Shared logic for converting Stack.Toolbar props to react-native-screens header items
├── StackHeaderComponent.tsx # Stack.Header
├── StackScreen.tsx # Stack.Screen
├── StackSearchBar.tsx # Stack.SearchBar
└── toolbar # Stack.Toolbar.* components

## Testing

All the tests for the stack header and toolbar are located in the `__tests__` folder. There are two types of tests:

- **Unit tests**: focusing on a simple functionality, but testing every edge case.
- **E2E tests**: testing the integration for example the toolbar with the stack header.

Example test separation for Stack.Toolbar.Button:

- unit tests: testing `convertStackToolbarButtonPropsToRNHeaderItem` function and

### Unit tests

- Should test the alignment with docs
- Should test the different combinations of props
- Should test edge cases

The unit tests should be placed in the files indicating the component they are testing. For example, the unit tests for `Stack.Toolbar.Button` should be in `StackToolbarButton.test.ios.tsx`.

### E2E tests

- Should utilize `renderRouter` to render a full navigation tree.
- Should mock `react-native-screens` API - `jest.mock('react-native-screens', () => { ... })`.
- Should mock `NativeToolbarItem`

The E2E tests should be placed in a single `StackToolbar.e2e.test.ios.tsx` file.
