export function getUnfocusedScreenProps(focused: boolean) {
  if (process.env.EXPO_OS === 'web') {
    return { inert: !focused };
  }
  return { 'aria-hidden': !focused };
}
