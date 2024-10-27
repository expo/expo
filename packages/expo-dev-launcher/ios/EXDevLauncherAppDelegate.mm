#import <EXDevLauncher/EXDevLauncherAppDelegate.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXDevLauncher/EXDevLauncherRCTBridge.h>

#import <EXDevMenu/DevClientNoOpLoadingView.h>

#import <React/RCTBundleURLProvider.h>
#if __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#endif

@interface RCTAppDelegate ()

- (RCTRootViewFactory *)createRCTRootViewFactory;
- (Class)getModuleClassFromName:(const char *)name;

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

- (Class)getModuleClassFromName:(const char *)name
{
  // Overrides DevLoadingView as no-op when loading dev-launcher bundle
  if (strcmp(name, "DevLoadingView") == 0) {
    return [DevClientNoOpLoadingView class];
  }
  return [super getModuleClassFromName:name];
}

@end
