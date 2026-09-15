export const PlatformColor = (...names: string[]) => {
  return { semantic: names };
};

type ResolvedImageSource = {
  uri: string;
  width?: number;
  height?: number;
  scale?: number;
};

function resolveAssetSource(source: unknown): ResolvedImageSource | null {
  if (source == null) {
    return null;
  }
  if (typeof source === 'object' && typeof (source as ResolvedImageSource).uri === 'string') {
    return source as ResolvedImageSource;
  }
  if (typeof source === 'number') {
    throw new Error(
      'Bundled require() image sources are not supported inside widgets. Copy the image to widgetsDirectory and pass source={{ uri }} instead.'
    );
  }
  throw new Error('Widget Image source must be an object containing a uri string.');
}

export const Image = { resolveAssetSource };

export const useColorScheme = (): 'light' | 'dark' | null => {
  return (globalThis.__expoWidgetEnvironment?.colorScheme as 'light' | 'dark' | undefined) ?? null;
};
