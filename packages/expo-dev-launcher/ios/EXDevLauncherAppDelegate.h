#import <ExpoModulesCore/RCTAppDelegate+Recreate.h>
#import <React/RCTRootView.h>

typedef NSURL * _Nullable (^EXDevLauncherBundleURLGetter)();

@interface EXDevLauncherAppDelegate : RCTAppDelegate

@property (nonatomic, copy, nonnull) EXDevLauncherBundleURLGetter bundleURLGetter;

- (instancetype)initWithBundleURLGetter:(nonnull EXDevLauncherBundleURLGetter)bundleURLGetter;
- (RCTRootViewFactory *)createRCTRootViewFactory;

@end
