#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTRootView.h>

@interface EXDevLauncherBridgeDelegate : NSObject

+ (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName
                                   launchOptions:(NSDictionary * _Nullable)launchOptions
                                    application:(UIApplication *)application;

@end
