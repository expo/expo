#import <EXDevMenu/DevClientAppDelegate.h>
#import <React/RCTRootView.h>

@interface EXDevLauncherBridgeDelegate : DevClientAppDelegate

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName
                                launchOptions:(NSDictionary *_Nullable)launchOptions
                                  application:(UIApplication *)application;

@end
