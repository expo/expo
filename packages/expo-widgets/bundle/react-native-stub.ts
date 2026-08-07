export const PlatformColor = (...names: string[]) => {
  return { semantic: names };
};

export const Image = {
  resolveAssetSource: {},
};

export const useColorScheme = (): 'light' | 'dark' | null => {
  return (globalThis.__expoWidgetEnvironment?.colorScheme as 'light' | 'dark' | undefined) ?? null;
};
