export const runtimePaths = [
  'React.xcframework',
  'packages/react-native/third-party/ReactNativeDependencies.xcframework',
  'destroot/Library/Frameworks/universal/hermesvm.xcframework',
];
export const runtimeNames = ['React', 'ReactNativeDependencies', 'hermesvm'];

export function runtimeBuildSettings(root: string): Record<string, any> {
  const runtimeDirs = runtimePaths.map(
    (path) =>
      `$(EXPO_APP_ROOT)/.expo-source/runtime/$(EXPO_RUNTIME_CONFIGURATION)/${path}/$(EXPO_RUNTIME_SLICE)`
  );
  const headerDirs = runtimeDirs.map(
    (dir, index) => `${dir}/${runtimeNames[index]}.framework/Headers`
  );
  headerDirs.push(
    ...[
      'ReactNativeHeaders.xcframework',
      'packages/react-native/third-party/ReactNativeDependenciesHeaders.xcframework',
    ].map(
      (path) =>
        `$(EXPO_APP_ROOT)/.expo-source/runtime/$(EXPO_RUNTIME_CONFIGURATION)/${path}/$(EXPO_RUNTIME_SLICE)/Headers`
    )
  );
  return {
    EXPO_APP_ROOT: root,
    IPHONEOS_DEPLOYMENT_TARGET: '16.4',
    SUPPORTED_PLATFORMS: 'iphoneos iphonesimulator',
    SDKROOT: 'iphoneos',
    CLANG_CXX_LANGUAGE_STANDARD: 'c++20',
    CLANG_ENABLE_MODULES: 'YES',
    CLANG_ENABLE_OBJC_ARC: 'YES',
    CLANG_ENABLE_OBJC_WEAK: 'NO',
    GCC_C_LANGUAGE_STANDARD: 'gnu11',
    GCC_NO_COMMON_BLOCKS: 'YES',
    ENABLE_STRICT_OBJC_MSGSEND: 'YES',
    ALWAYS_SEARCH_USER_PATHS: 'NO',
    COPY_PHASE_STRIP: 'NO',
    CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES: 'YES',
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: 'NO',
    'EXPO_RUNTIME_SLICE[sdk=iphoneos*]': 'ios-arm64',
    'EXPO_RUNTIME_SLICE[sdk=iphonesimulator*]': 'ios-arm64_x86_64-simulator',
    FRAMEWORK_SEARCH_PATHS: ['$(inherited)', ...runtimeDirs],
    HEADER_SEARCH_PATHS: [
      '$(inherited)',
      '$(EXPO_APP_ROOT)/.expo-source/headers',
      '$(EXPO_APP_ROOT)/.expo-source/modulemaps/$(EXPO_RUNTIME_CONFIGURATION)/$(EXPO_RUNTIME_SLICE)',
      '$(EXPO_APP_ROOT)/.expo-source/runtime/$(EXPO_RUNTIME_CONFIGURATION)/ReactNativeHeaders.xcframework/$(EXPO_RUNTIME_SLICE)/Headers',
      ...headerDirs,
    ],
    OTHER_CPLUSPLUSFLAGS: [
      '$(inherited)',
      '-DFOLLY_MOBILE=1',
      '-DFOLLY_USE_LIBCPP=1',
      '-DFOLLY_CFG_NO_COROUTINES=1',
      '-DFOLLY_HAVE_CLOCK_GETTIME=1',
    ],
    OTHER_LDFLAGS: [
      '$(inherited)',
      '-lc++',
      '-ObjC',
      ...runtimeNames.flatMap((name) => ['-framework', name]),
    ],
    SWIFT_VERSION: '6.0',
    SWIFT_STRICT_CONCURRENCY: 'minimal',
    ENABLE_USER_SCRIPT_SANDBOXING: 'NO',
    GENERATE_INFOPLIST_FILE: 'YES',
    DEFINES_MODULE: 'YES',
    SKIP_INSTALL: 'YES',
    TARGETED_DEVICE_FAMILY: '1,2',
    VALIDATE_PRODUCT: 'YES',
    CODE_SIGNING_ALLOWED: 'NO',
    SWIFT_INSTALL_OBJC_HEADER: 'YES',
    USE_HEADERMAP: 'YES',
    PRODUCT_NAME: '$(TARGET_NAME)',
    DYLIB_INSTALL_NAME_BASE: '@rpath',
    INSTALL_PATH: '$(LOCAL_LIBRARY_DIR)/Frameworks',
    DYLIB_COMPATIBILITY_VERSION: '1',
    DYLIB_CURRENT_VERSION: '1',
    CURRENT_PROJECT_VERSION: '1',
    VERSIONING_SYSTEM: 'apple-generic',
    LD_RUNPATH_SEARCH_PATHS: [
      '$(inherited)',
      '@executable_path/Frameworks',
      '@loader_path/Frameworks',
    ],
  };
}
