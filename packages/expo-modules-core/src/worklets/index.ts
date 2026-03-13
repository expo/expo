export function installOnUIRuntime() {
  const installOnUIRuntimeNative = globalThis?.expo?.installOnUIRuntime;
  if (!installOnUIRuntimeNative) {
    throw Error(
      "Native method to install Expo Modules on Reanimated UI worklet runtime wasn't found in `expo-modules-core`."
    );
  }

  installOnUIRuntimeNative();
}
