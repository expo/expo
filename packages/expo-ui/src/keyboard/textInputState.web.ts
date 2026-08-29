// React Native for web has no `TextInputState`: the browser owns focus. This file
// is also what keeps the deep import in `textInputState.ts` out of the web bundle.
// `@expo/ui/swift-ui` and `@expo/ui/jetpack-compose` have no web entry point, so a
// cross-platform file importing either one puts this module in the web graph, and
// without this variant the whole bundle fails to resolve rather than reaching the
// `UnavailabilityError` those entry points already throw on web.
export const TextInputState = {
  currentlyFocusedInput: () => null,
  focusInput: () => {},
  blurInput: () => {},
  registerInput: () => {},
  unregisterInput: () => {},
  isTextInput: () => false,
  focusTextInput: () => {},
  blurTextInput: () => {},
};
