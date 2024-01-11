#import <EXDevLauncher/EXDevLauncherBridgeDelegate.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXDevLauncher/EXDevLauncherRCTBridge.h>

#import <React/RCTBundleURLProvider.h>
#if __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#endif

#ifdef USE_NEW_ARCH

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

#endif

@implementation EXDevLauncherBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceURLForBridge:bridge];
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions {
   return [[EXDevLauncherRCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName launchOptions:(NSDictionary * _Nullable)launchOptions application:(UIApplication *)application{
    BOOL enableTM = NO;
#if USE_NEW_ARCH
    enableTM = YES;
#endif

#if REACT_NATIVE_MINOR_VERSION >= 74
    RCTAppSetupPrepareApp(application, enableTM, facebook::react::EmptyReactNativeConfig());
#else
    RCTAppSetupPrepareApp(application, enableTM);
#endif

    self.bridge = [super createBridgeAndSetAdapterWithLaunchOptions:launchOptions];

    NSMutableDictionary *initProps = [NSMutableDictionary new];
#ifdef USE_NEW_ARCH
    initProps[kRNConcurrentRoot] = @YES;
#endif


    return [super createRootViewWithBridge:self.bridge moduleName:moduleName initProps:initProps];
}

@end
