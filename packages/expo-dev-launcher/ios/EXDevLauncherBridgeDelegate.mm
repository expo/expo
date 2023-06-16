#import "EXDevLauncherBridgeDelegate.h"
#import "EXDevLauncherController.h"

#import <React/RCTBundleURLProvider.h>
#import "RCTAppSetupUtils.h"

#ifdef RCT_NEW_ARCH_ENABLED

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

#endif

@implementation EXDevLauncherBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceURLForBridge:bridge];
}

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName launchOptions:(NSDictionary * _Nullable)launchOptions application:(UIApplication *)application{
    BOOL enableTM = NO;
#if RCT_NEW_ARCH_ENABLED
    enableTM = YES;
#endif

    RCTAppSetupPrepareApp(application, enableTM);

    self.bridge = [super createBridgeAndSetAdapterWithLaunchOptions:launchOptions];

    NSMutableDictionary *initProps = [NSMutableDictionary new];
#ifdef RCT_NEW_ARCH_ENABLED
    initProps[kRNConcurrentRoot] = @YES;
#endif


    return [super createRootViewWithBridge:self.bridge moduleName:moduleName initProps:initProps];
}

@end
