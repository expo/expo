#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <React/RCTRootView.h>

@interface ExpoDevLauncherBridgeDelegateHandler : RCTAppDelegate

- (RCTBridge *)createBridgeAndSetAdapterWithLaunchOptions:(NSDictionary *_Nullable)launchOptions;

@end
