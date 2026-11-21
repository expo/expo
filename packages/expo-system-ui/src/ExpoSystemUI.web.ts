export default {
  getBackgroundColorAsync() {
    if (typeof window === 'undefined') {
      return null;
    }
    const normalizeColor =
      require('react-native-web/dist/exports/StyleSheet/compiler/normalizeColor.js').default;
    return normalizeColor(document.body.style.backgroundColor);
  },
  setBackgroundColorAsync(color: string | null) {
    if (typeof window !== 'undefined') {
      document.body.style.backgroundColor = color ?? 'white';
    }
  },
};
