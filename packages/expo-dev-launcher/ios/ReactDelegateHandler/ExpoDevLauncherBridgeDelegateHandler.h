#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <React/RCTRootView.h>

@interface ExpoDevLauncherBridgeDelegateHandler : RCTAppDelegate

- (RCTBridge *)createBridgeWithAdapter:(NSDictionary *_Nullable)launchOptions;

@end
