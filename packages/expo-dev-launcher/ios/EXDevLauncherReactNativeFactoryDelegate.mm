#import <EXDevLauncher/EXDevLauncherReactNativeFactoryDelegate.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXDevLauncher/EXDevLauncherRCTBridge.h>
#import "EXDevLauncherReactNativeFactory.h"


@implementation EXDevLauncherReactNativeFactoryDelegate

- (instancetype)initWithBundleURLGetter:(nonnull EXDevLauncherBundleURLGetter)bundleURLGetter
{
  if (self = [super init]) {
    self.bundleURLGetter = bundleURLGetter;
    self.reactNativeFactory = [[EXDevLauncherReactNativeFactory alloc] initWithDelegate:self];
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
