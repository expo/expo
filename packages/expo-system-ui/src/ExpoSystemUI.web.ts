// @ts-ignore: untyped
import normalizeColor from 'react-native-web/dist/cjs/modules/normalizeColor';

export default {
  getBackgroundColorAsync() {
    if (typeof document !== 'undefined') {
      return normalizeColor(document.body.style.backgroundColor);
    } else {
      return null;
    }
  },
  setBackgroundColorAsync(color: string | null) {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = color ?? 'white';
    }
  },
};
