#import "ExpoAppInstance.h"
#import <ReactCommon/RCTTurboModuleManager.h>


@interface ExpoAppInstance () <RCTTurboModuleManagerDelegate>
@end

@implementation ExpoAppInstance

- (instancetype)initWithSourceURL:(NSURL *)sourceURL manager:(EXVersionManagerObjC *)manager onLoad:(nonnull OnLoad)onLoad {
  if (self = [self init]) {
    _sourceURL = sourceURL;
    _manager = manager;
    _onLoad = onLoad;
  }
  return self;
}

- (NSURL *)bundleURL {
  return _sourceURL;
}

- (RCTRootViewFactory *)createRCTRootViewFactory {
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    ExpoAppInstance *strongSelf = weakSelf;
    return strongSelf.bundleURL;
  };
  
  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                   newArchEnabled:self.fabricEnabled
                                               turboModuleEnabled:self.turboModuleEnabled
                                                bridgelessEnabled:self.bridgelessEnabled];
  
  configuration.loadSourceForHost = ^(RCTHost * _Nonnull host, RCTSourceLoadBlock _Nonnull loadCallback) {
    weakSelf.onLoad(host, loadCallback);
  };

  return [[RCTRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:self];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [_manager extraModules];
}

- (Class)getModuleClassFromName:(const char *)name {
  return [_manager getModuleClassFromName:name];
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass {
  return [_manager getModuleInstanceFromClass:moduleClass];
}

- (void)hostDidStart:(RCTHost *)host
{
  [_manager hostDidStart:[self bundleURL]];
}

@end
