// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXHostWrapper.h>

#import <ReactCommon/RCTHost.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTMountingManager.h>
#import <React/RCTComponentViewRegistry.h>

@implementation EXHostWrapper {
  __weak RCTHost *_host;
}

- (instancetype)initWithHost:(RCTHost *)host
{
  if (self = [super init]) {
    _host = host;
  }
  return self;
}

- (nullable id)findModuleWithName:(nonnull NSString *)name lazilyLoadIfNecessary:(BOOL)lazilyLoadIfNecessary
{
  RCTModuleRegistry *moduleRegistry = _host.moduleRegistry;
  return [moduleRegistry moduleForName:[name UTF8String] lazilyLoadIfNecessary:lazilyLoadIfNecessary];
}

- (nullable UIView *)findViewWithTag:(NSInteger)tag
{
  RCTComponentViewRegistry *componentViewRegistry = _host.surfacePresenter.mountingManager.componentViewRegistry;
  return [componentViewRegistry findComponentViewWithTag:tag];
}

@end

@implementation EXRuntimeWrapper {
  std::shared_ptr<facebook::jsi::Runtime> _runtime;
}

- (instancetype)init:(facebook::jsi::Runtime &)runtime
{
  if (self = [super init]) {
    _runtime = std::shared_ptr<facebook::jsi::Runtime>(std::shared_ptr<facebook::jsi::Runtime>(), &runtime);
  }
  return self;
}

- (nonnull facebook::jsi::Runtime *)consume
{
  return _runtime.get();
}

@end
