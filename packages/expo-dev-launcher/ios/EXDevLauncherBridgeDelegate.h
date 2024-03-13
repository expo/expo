#import <EXDevMenu/DevClientAppDelegate.h>
#import <React/RCTRootView.h>

typedef NSURL * _Nullable (^EXDevLauncherBundleURLGetter)();

@interface EXDevLauncherBridgeDelegate : DevClientAppDelegate

@property (nonatomic, copy, nonnull) EXDevLauncherBundleURLGetter bundleURLGetter;

- (instancetype)initWithBundleURLGetter:(nonnull EXDevLauncherBundleURLGetter)bundleURLGetter;

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName
                                launchOptions:(NSDictionary *_Nullable)launchOptions
                                  application:(UIApplication *)application;

@end
