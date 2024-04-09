#import <EXDevLauncher/EXDevLauncherAppDelegate.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXDevLauncher/EXDevLauncherRCTBridge.h>

#import <React/RCTBundleURLProvider.h>
#if __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#endif

@interface RCTAppDelegate ()

- (RCTRootViewFactory *)createRCTRootViewFactory;

@end

@implementation EXDevLauncherAppDelegate


- (instancetype)initWithBundleURLGetter:(nonnull EXDevLauncherBundleURLGetter)bundleURLGetter
{
  if (self = [self init]) {
    self.bundleURLGetter = bundleURLGetter;
  }
  return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return self.bundleURLGetter();
}

- (NSURL *)bundleURL {
  return self.bundleURLGetter();
}

@end
