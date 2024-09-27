#import "ExpoAppInstance.h"
#import "EXAppViewController.h"
#import "ExpoModulesCore/EXReactRootViewFactory.h"
#import "RCTAppSetupUtils.h"


@implementation ExpoAppInstance

- (instancetype)initWithSourceURL:(NSURL *)sourceURL manager:(EXVersionManagerObjC *)manager {
  self = [super init];
  if (self) {
    _sourceURL = sourceURL;
    _manager = manager;
  }
  return self;
}

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
