// Test-only: randomly crashes (native / runtime / not at all) at app startup to
// exercise crash reporting. Off by default — enable per platform via app.json props:
//   ["./plugins/withCrashOnLaunch", { "android": true, "ios": true }]
const { withMainApplication, withAppDelegate, CodeGenerator } = require('expo/config-plugins');

// SIGSEGV isn't stored as a report; the JVM throw is. Throwing here is safe — onCreate
// isn't wrapped by expo-modules-core's exception decorator.
const ANDROID_CRASH_BLOCK = `    when ((0..5).random()) {
      0 -> android.system.Os.kill(android.os.Process.myPid(), android.system.OsConstants.SIGSEGV)
      1 -> throw RuntimeException("Intentional crash-on-launch test (JVM)")
      else -> { /* no crash */ }
    }`;

// MetricKit captures both outcomes and delivers them on the next launch.
const IOS_CRASH_BLOCK = `    switch Int.random(in: 0...5) {
    case 0:
      // EXC_BAD_ACCESS — bogus pointer deref.
      _ = UnsafePointer<Int>(bitPattern: 0x1)!.pointee
    case 1:
      // Uncaught NSException — sets exceptionReason.
      NSException(name: .genericException, reason: "Intentional crash-on-launch test (iOS)", userInfo: nil).raise()
    default:
      break // no crash
    }`;

const withCrashOnLaunch = (config, { android = false, ios = false } = {}) => {
  if (android) {
    config = withMainApplication(config, (config) => {
      config.modResults.contents = CodeGenerator.mergeContents({
        src: config.modResults.contents,
        newSrc: ANDROID_CRASH_BLOCK,
        tag: 'crash-on-launch',
        anchor: /ApplicationLifecycleDispatcher\.onApplicationCreate\(this\)/,
        offset: 1,
        comment: '    //',
      }).contents;
      return config;
    });
  }

  if (ios) {
    config = withAppDelegate(config, (config) => {
      config.modResults.contents = CodeGenerator.mergeContents({
        src: config.modResults.contents,
        newSrc: IOS_CRASH_BLOCK,
        tag: 'crash-on-launch',
        anchor: /\)\s*->\s*Bool\s*\{/,
        offset: 1,
        comment: '    //',
      }).contents;
      return config;
    });
  }

  return config;
};

module.exports = withCrashOnLaunch;
