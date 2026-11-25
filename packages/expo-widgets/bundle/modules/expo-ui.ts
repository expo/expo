import type { MaterialColorsOptions } from '@expo/ui/jetpack-compose';

export default {
  getMaterialColors(options: MaterialColorsOptions) {
    if (options?.seedColor != null) {
      throw new Error(
        "'seedColor' is not supported inside a widgets. Omit 'seedColor' to use the device palette."
      );
    }
    const environment = globalThis.__expoWidgetEnvironment;
    const scheme = options?.scheme ?? environment?.colorScheme;
    const palettes = environment?.materialColors as
      | Record<string, Record<string, string>>
      | undefined;
    const palette = palettes?.[scheme === 'dark' ? 'dark' : 'light'];
    if (!palette) {
      throw new Error('getMaterialColors is only available on widget render.');
    }
    return palette;
  },
};
