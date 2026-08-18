import picomatch from 'picomatch';

export function createGlobFilter(
  globPattern: picomatch.Glob,
  options?: picomatch.PicomatchOptions
) {
  const matcher = picomatch(globPattern, options);

  return (path: string) => {
    return matcher(path);
  };
}
