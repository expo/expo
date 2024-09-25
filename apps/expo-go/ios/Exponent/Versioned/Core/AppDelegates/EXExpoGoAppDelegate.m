#import "EXExpoGoAppDelegate.h"
#import "EXAppViewController.h"
#import "ExpoModulesCore/EXReactRootViewFactory.h"
#import "RCTAppSetupUtils.h"

id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass);

@implementation EXExpoGoAppDelegate

- (NSURL *)bundleURL {
  return _sourceURL;
}

- (UIViewController *)createRootViewController {
  return [EXAppViewController new];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [_manager extraModulesForBridge:bridge];
}

- (Class)getModuleClassFromName:(const char *)name {
  return [_manager getModuleClassFromName:name];
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass {
  return [_manager getModuleInstanceFromClass:moduleClass];
}

@end
