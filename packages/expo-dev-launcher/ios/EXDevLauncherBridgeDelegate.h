#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <React/RCTRootView.h>

@interface EXDevLauncherBridgeDelegate : RCTAppDelegate

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName
                                launchOptions:(NSDictionary *_Nullable)launchOptions
                                  application:(UIApplication *)application;

@end
