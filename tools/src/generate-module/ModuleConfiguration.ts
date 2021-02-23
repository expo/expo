export interface ModuleConfiguration {
  /**
   * Name of the module from `package.json`.
   */
  npmModuleName: string;

  /**
   * Name of the pod for this module, used by the CocoaPods iOS package manager.
   */
  podName: string;

  /**
   * The Android library's package name.
   */
  javaPackage: string;

  /**
   * Name of the JavaScript package.
   */
  jsPackageName: string;

  /**
   * Indicates whether the module has a native ViewManager.
   */
  viewManager: boolean;
}
