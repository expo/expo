// Learn more https://docs.expo.dev/router/advanced/native-intent/

export async function redirectSystemPath(intent: {
  path: string;
  initial: boolean;
}): Promise<string> {
  // Manipulate the path before returning to redirect on native.
  return intent.path;
}
