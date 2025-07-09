// This is a shim for web and Android where the tab bar is generally opaque.
export const TabBarBackground = undefined;

export function useBottomTabOverflow() {
  return {
    scrollInsetBottom: 0,
    paddingBottom: 0,
  }
}
