// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXHostWrapper.h>
#import <ExpoModulesCore/EXAppContextProtocol.h>

#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTHost+Internal.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTMountingManager.h>
#import <React/RCTComponentViewRegistry.h>

@interface EXHostWrapper () <RCTSurfacePresenterObserver>
@end

@implementation EXHostWrapper {
  __weak RCTHost *_host;
  __weak id<EXAppContextProtocol> _mountingAppContext;
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

- (nullable NSURL *)bundleURL
{
  return [_host.bundleManager bundleURL];
}

#pragma mark - Mounting

- (void)observeMountingForAppContext:(nonnull id<EXAppContextProtocol>)appContext
{
  _mountingAppContext = appContext;
  // The surface presenter keeps observers weakly, so they don't need to be removed.
  // Its header calls the observer API deprecated, but it's the only public notification
  // that is sent right before the host creates component views.
  [_host.surfacePresenter addObserver:self];
}

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag
{
  [_mountingAppContext hostWillMountComponents];
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  [_mountingAppContext hostDidMountComponents];
}

@end
