/**
 * Additional `xcodebuild` build settings that overrides project's and target's build settings.
 * See https://xcodebuildsettings.com for full documentation.
 */
export type XcodebuildSettings = Record<string, string | boolean>;

export type Flavor = {
  /**
   * Xcode configuration to use.
   * Default build settings might be different depending on the configuration.
   */
  configuration: 'Release' | 'Debug';

  /**
   * The iOS SDK to use. The device and the simulator have different SDKs,
   * so basically it means whether you want to build for the device or simulator.
   */
  sdk: 'iphoneos' | 'iphonesimulator';

  /**
   * An array of CPU architectures to build against.
   */
  archs: ('arm64' | 'x86_64' | 'i386')[];
};

export type Framework = {
  /**
   * Name of the target that the framework was built from.
   */
  target: string;

  /**
   * The flavor object based on which the framework was built.
   */
  flavor: Flavor;

  /**
   * Path to the artifact — `.framework` file.
   */
  frameworkPath: string;

  /**
   * Size of the artifact binary in bytes.
   */
  binarySize: number;
};
