// Copyright 2024-present 650 Industries. All rights reserved.

#import "EXHBCRuntimeDelegate.h"
#import <ExpoModulesCore/EXHBCRuntimeManager.h>
#import <ExpoModulesCore/Swift.h>

@implementation EXHBCRuntimeDelegate {
  __weak EXAppContext *_appContext;
}

- (instancetype)initWithAppContext:(EXAppContext *)appContext
{
  if (self = [super init]) {
    _appContext = appContext;
  }
  return self;
}

#pragma mark - RCTHostRuntimeDelegate

#if EXPO_HBC_RCTHOST_AVAILABLE
- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  NSLog(@"EXHBCRuntimeDelegate: Runtime initialized (new arch), injecting HBC files");
  
  if (!_appContext) {
    NSLog(@"EXHBCRuntimeDelegate: App context is nil, skipping HBC injection");
    return;
  }
  
  @try {
    [self injectHBCFilesIntoRuntime:runtime];
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeDelegate: Exception during HBC injection: %@", exception.reason);
  }
}
#else
- (void)host:(id)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  NSLog(@"EXHBCRuntimeDelegate: Runtime initialized (legacy), injecting HBC files");
  
  if (!_appContext) {
    NSLog(@"EXHBCRuntimeDelegate: App context is nil, skipping HBC injection");
    return;
  }
  
  @try {
    [self injectHBCFilesIntoRuntime:runtime];
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeDelegate: Exception during HBC injection: %@", exception.reason);
  }
}
#endif

- (void)injectHBCForLegacyArchitecture
{
  NSLog(@"EXHBCRuntimeDelegate: Manual HBC injection for legacy architecture");
  
  if (!_appContext || !_appContext._runtime) {
    NSLog(@"EXHBCRuntimeDelegate: App context or runtime is nil, skipping HBC injection");
    return;
  }
  
  @try {
    facebook::jsi::Runtime *jsiRuntime = [_appContext._runtime get];
    if (jsiRuntime) {
      [self injectHBCFilesIntoRuntime:*jsiRuntime];
    }
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeDelegate: Exception during legacy HBC injection: %@", exception.reason);
  }
}

- (void)handleRuntimeInitialization:(void *)runtime forHost:(id)host
{
  NSLog(@"EXHBCRuntimeDelegate: Unified runtime initialization handler");
  
  if (!runtime) {
    NSLog(@"EXHBCRuntimeDelegate: Runtime is null, skipping HBC injection");
    return;
  }
  
  if (!_appContext) {
    NSLog(@"EXHBCRuntimeDelegate: App context is nil, skipping HBC injection");
    return;
  }
  
  @try {
    // Cast back to JSI runtime reference
    facebook::jsi::Runtime &jsiRuntime = *static_cast<facebook::jsi::Runtime *>(runtime);
    [self injectHBCFilesIntoRuntime:jsiRuntime];
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeDelegate: Exception during unified HBC injection: %@", exception.reason);
  }
}

#pragma mark - Private Methods

- (void)injectHBCFilesIntoRuntime:(facebook::jsi::Runtime &)runtime
{
  // First, inject debug marker to verify the system is working
  [self injectDebugMarkerIntoRuntime:runtime];
  
  // Discover and inject HBC files
  NSArray<NSURL *> *hbcFiles = [self discoverHBCFiles];
  
  if (hbcFiles.count == 0) {
    NSLog(@"EXHBCRuntimeDelegate: No HBC files found");
    return;
  }
  
  NSLog(@"EXHBCRuntimeDelegate: Found %lu HBC file(s) to inject", (unsigned long)hbcFiles.count);
  
  for (NSURL *hbcFile in hbcFiles) {
    [self injectHBCFileAtURL:hbcFile intoRuntime:runtime];
  }
}

- (void)injectDebugMarkerIntoRuntime:(facebook::jsi::Runtime &)runtime
{
  NSLog(@"EXHBCRuntimeDelegate: Injecting debug marker");
  
  NSString *debugScript = @""
    "// Expo HBC Injection Debug Marker\n"
    "globalThis.EXPO_HBC_INJECTED = true;\n"
    "globalThis.EXPO_HBC_INJECTION_TIME = Date.now();\n"
    "console.log('Expo HBC injection system is working! Time:', globalThis.EXPO_HBC_INJECTION_TIME);";
  
  NSData *debugData = [debugScript dataUsingEncoding:NSUTF8StringEncoding];
  if (debugData) {
    [EXHBCRuntimeManager injectJavaScriptCode:debugData intoRuntime:(void *)&runtime];
    NSLog(@"EXHBCRuntimeDelegate: Debug marker injected successfully");
  }
}

- (NSArray<NSURL *> *)discoverHBCFiles
{
  NSMutableArray<NSURL *> *hbcFiles = [NSMutableArray array];
  
  // Search in main bundle
  NSURL *mainBundleHBC = [[NSBundle mainBundle] URLForResource:@"bundle" withExtension:@"hbc"];
  if (mainBundleHBC) {
    [hbcFiles addObject:mainBundleHBC];
  }
  
  // Search in ExpoModulesCore bundle
  NSBundle *coreBundle = [NSBundle bundleForClass:[self class]];
  NSURL *coreBundleHBC = [coreBundle URLForResource:@"bundle" withExtension:@"hbc"];
  if (coreBundleHBC) {
    [hbcFiles addObject:coreBundleHBC];
  }
  
  // Search in any additional bundles that might contain HBC files
  NSString *bundlePath = [[NSBundle mainBundle] pathForResource:@"ExpoModulesCore" ofType:@"bundle"];
  if (bundlePath) {
    NSBundle *expoBundle = [NSBundle bundleWithPath:bundlePath];
    NSURL *expoBundleHBC = [expoBundle URLForResource:@"bundle" withExtension:@"hbc"];
    if (expoBundleHBC) {
      [hbcFiles addObject:expoBundleHBC];
    }
  }
  
  return [hbcFiles copy];
}

- (void)injectHBCFileAtURL:(NSURL *)url intoRuntime:(facebook::jsi::Runtime &)runtime
{
  if (![[NSFileManager defaultManager] fileExistsAtPath:url.path]) {
    NSLog(@"EXHBCRuntimeDelegate: HBC file not found at path: %@", url.path);
    return;
  }
  
  NSError *error;
  NSData *data = [NSData dataWithContentsOfURL:url options:0 error:&error];
  if (!data) {
    NSLog(@"EXHBCRuntimeDelegate: Failed to read HBC file at %@: %@", url.path, error.localizedDescription);
    return;
  }
  
  NSLog(@"EXHBCRuntimeDelegate: Injecting HBC file: %@ (%lu bytes)", url.lastPathComponent, (unsigned long)data.length);
  
  BOOL success = [EXHBCRuntimeManager injectJavaScriptCode:data intoRuntime:(void *)&runtime];
  if (success) {
    NSLog(@"EXHBCRuntimeDelegate: Successfully injected HBC file: %@", url.lastPathComponent);
  } else {
    NSLog(@"EXHBCRuntimeDelegate: Failed to inject HBC file: %@", url.lastPathComponent);
  }
}

@end