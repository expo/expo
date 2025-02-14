#import <ExpoModulesCore/RCTAppDelegate+Recreate.h>
#import <React/RCTRootView.h>
#import <ExpoModulesCore/EXReactNativeFactoryDelegate.h>

typedef NSURL * _Nullable (^EXDevLauncherBundleURLGetter)(void);

@interface EXDevLauncherAppDelegate : EXReactNativeFactoryDelegate

@property (nonatomic, copy, nonnull) EXDevLauncherBundleURLGetter bundleURLGetter;

- (instancetype _Nonnull)initWithBundleURLGetter:(nonnull EXDevLauncherBundleURLGetter)bundleURLGetter;

@property(nonatomic, strong, nonnull) RCTReactNativeFactory *reactNativeFactory;

@end
