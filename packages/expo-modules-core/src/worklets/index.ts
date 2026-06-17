/**
 * Installs Expo Modules on the UI worklet runtime so worklet callbacks and
 * serializable SharedObjects work there.
 *
 * @param uiRuntimeHolder The UI runtime holder from `getUIRuntimeHolder()` in
 * `react-native-worklets`.
 */
export function installOnUIRuntime(uiRuntimeHolder: object) {
  const installOnUIRuntimeNative = globalThis?.expo?.installOnUIRuntime;
  if (!installOnUIRuntimeNative) {
    throw Error(
      "Native method to install Expo Modules on the worklets UI runtime wasn't found in `expo-modules-core`."
    );
  }

  installOnUIRuntimeNative(uiRuntimeHolder);
}
