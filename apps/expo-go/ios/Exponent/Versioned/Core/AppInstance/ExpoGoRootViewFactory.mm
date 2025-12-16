#import "ExpoGoRootViewFactory.h"

#import <ReactCommon/RCTHost+Internal.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/runtime/JSRuntimeFactory.h>
#import <react/runtime/JSRuntimeFactoryCAPI.h>
#import <jsi/jsi.h>

@implementation ExpoGoRootViewFactory {
  __weak id<RCTTurboModuleManagerDelegate> _turboModuleManagerDelegate;
  __weak id<RCTHostDelegate> _hostDelegate;
  RCTRootViewFactoryConfiguration *_configuration;
}

- (instancetype)initWithTurboModuleDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                               hostDelegate:(id<RCTHostDelegate>)hostDelegate
                              configuration:(RCTRootViewFactoryConfiguration *)configuration
{
  if (self = [super initWithTurboModuleDelegate:turboModuleManagerDelegate
                                   hostDelegate:hostDelegate
                                  configuration:configuration]) {
    _turboModuleManagerDelegate = turboModuleManagerDelegate;
    _hostDelegate = hostDelegate;
    _configuration = configuration;
  }
  return self;
}

- (RCTHost *)createReactHost:(NSDictionary *)launchOptions
        devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  __weak __typeof(self) weakSelf = self;

  RCTHost *reactHost =
      [[RCTHost alloc] initWithBundleURLProvider:_configuration.bundleURLBlock
                                    hostDelegate:_hostDelegate
                      turboModuleManagerDelegate:_turboModuleManagerDelegate
                                jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                  return [weakSelf createJSRuntimeFactory];
                                }
                                   launchOptions:launchOptions
                            devMenuConfiguration:devMenuConfiguration];

  [reactHost setBundleURLProvider:_configuration.bundleURLBlock];

  // Set ourselves as the runtime delegate to inject builtins before the main bundle loads
  // This MUST be set before calling [reactHost start]
  reactHost.runtimeDelegate = self;

  [reactHost start];

  return reactHost;
}

- (std::shared_ptr<facebook::react::JSRuntimeFactory>)createJSRuntimeFactory
{
  if (_configuration.jsRuntimeConfiguratorDelegate == nil) {
    [NSException raise:@"ExpoGoRootViewFactory::createJSRuntimeFactory not implemented"
                format:@"Configuration must have a jsRuntimeConfiguratorDelegate"];
    return nullptr;
  }

  auto jsRuntimeFactory = [_configuration.jsRuntimeConfiguratorDelegate createJSRuntimeFactory];

  // The jsRuntimeFactory from the delegate is a raw pointer that needs to be wrapped
  return std::shared_ptr<facebook::react::JSRuntimeFactory>(
      reinterpret_cast<facebook::react::JSRuntimeFactory *>(jsRuntimeFactory),
      &js_runtime_factory_destroy);
}

#pragma mark - RCTHostRuntimeDelegate

- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  [self _loadBuiltinsIntoRuntime:runtime];
}

#pragma mark - Private

- (void)_loadBuiltinsIntoRuntime:(facebook::jsi::Runtime &)runtime
{
  NSString *builtinsPath = [[NSBundle mainBundle] pathForResource:@"builtins" ofType:@"hbc"];
  if (!builtinsPath) {
    NSLog(@"[ExpoGoRootViewFactory] No builtins.hbc found in bundle, skipping builtins injection");
    return;
  }

  NSData *builtinsData = [NSData dataWithContentsOfFile:builtinsPath];
  if (!builtinsData || builtinsData.length == 0) {
    NSLog(@"[ExpoGoRootViewFactory] Failed to load builtins.hbc or file is empty");
    return;
  }

  @try {
    auto buffer = std::make_shared<facebook::jsi::StringBuffer>(
        std::string(static_cast<const char *>(builtinsData.bytes), builtinsData.length));
    runtime.evaluateJavaScript(buffer, "builtins.hbc");
    NSLog(@"[ExpoGoRootViewFactory] Successfully loaded builtins");
  } @catch (NSException *exception) {
    NSLog(@"[ExpoGoRootViewFactory] Exception while loading builtins: %@", exception);
  }
}

@end
