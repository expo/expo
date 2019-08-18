/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTSurfacePresenter.h"

#import <ReactABI32_0_0/ABI32_0_0RCTAssert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTBridge+Private.h>
#import <ReactABI32_0_0/ABI32_0_0RCTComponentViewRegistry.h>
#import <ReactABI32_0_0/ABI32_0_0RCTFabricSurface.h>
#import <ReactABI32_0_0/ABI32_0_0RCTMountingManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTMountingManagerDelegate.h>
#import <ReactABI32_0_0/ABI32_0_0RCTScheduler.h>
#import <ReactABI32_0_0/ABI32_0_0RCTSurfaceRegistry.h>
#import <ReactABI32_0_0/ABI32_0_0RCTSurfaceView.h>
#import <ReactABI32_0_0/ABI32_0_0RCTSurfaceView+Internal.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUtils.h>
#import <ABI32_0_0fabric/ABI32_0_0core/LayoutContext.h>
#import <ABI32_0_0fabric/ABI32_0_0core/LayoutConstraints.h>

#import "ABI32_0_0RCTConversions.h"

using namespace facebook::ReactABI32_0_0;

@interface ABI32_0_0RCTSurfacePresenter () <ABI32_0_0RCTSchedulerDelegate, ABI32_0_0RCTMountingManagerDelegate>
@end

@implementation ABI32_0_0RCTSurfacePresenter {
  ABI32_0_0RCTScheduler *_scheduler;
  ABI32_0_0RCTMountingManager *_mountingManager;
  ABI32_0_0RCTBridge *_bridge;
  ABI32_0_0RCTBridge *_batchedBridge;
  ABI32_0_0RCTSurfaceRegistry *_surfaceRegistry;
}

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    _scheduler = [[ABI32_0_0RCTScheduler alloc] init];
    _scheduler.delegate = self;

    _surfaceRegistry = [[ABI32_0_0RCTSurfaceRegistry alloc] init];
    _mountingManager = [[ABI32_0_0RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillReloadNotification:)
                                                 name:ABI32_0_0RCTBridgeWillReloadNotification
                                               object:_bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptDidLoadNotification:)
                                                 name:ABI32_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI32_0_0RCTSchedulerDelegate

- (void)schedulerDidComputeMutationInstructions:(facebook::ReactABI32_0_0::TreeMutationInstructionList)instructions
                                        rootTag:(ReactABI32_0_0Tag)rootTag
{
  [_mountingManager mutateComponentViewTreeWithMutationInstructions:instructions
                                                            rootTag:rootTag];
}

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName
{
  [_mountingManager preliminaryCreateComponentViewWithName:componentName];
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(ABI32_0_0RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  [_scheduler registerRootTag:surface.rootTag];
  [self runSurface:surface];

  // FIXME: Mutation instruction MUST produce instruction for root node.
  [_mountingManager.componentViewRegistry dequeueComponentViewWithName:@"Root" tag:surface.rootTag];
}

- (void)unregisterSurface:(ABI32_0_0RCTFabricSurface *)surface
{
  [self stopSurface:surface];
  [_scheduler unregisterRootTag:surface.rootTag];
  [_surfaceRegistry unregisterSurface:surface];
}

- (ABI32_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI32_0_0Tag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI32_0_0RCTFabricSurface *)surface
{
  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = ABI32_0_0RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = ABI32_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI32_0_0RCTSizeFromCGSize(maximumSize);

  return [_scheduler measureWithLayoutConstraints:layoutConstraints
                                    layoutContext:layoutContext
                                          rootTag:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(ABI32_0_0RCTFabricSurface *)surface
{
  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = ABI32_0_0RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = ABI32_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI32_0_0RCTSizeFromCGSize(maximumSize);

  [_scheduler constraintLayoutWithLayoutConstraints:layoutConstraints
                                      layoutContext:layoutContext
                                            rootTag:surface.rootTag];
}

- (void)runSurface:(ABI32_0_0RCTFabricSurface *)surface
{
  NSDictionary *applicationParameters = @{
    @"rootTag": @(surface.rootTag),
    @"initialProps": surface.properties,
  };

  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[surface.moduleName, applicationParameters] completion:NULL];
}

- (void)stopSurface:(ABI32_0_0RCTFabricSurface *)surface
{
  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"unmountApplicationComponentAtRootTag" args:@[@(surface.rootTag)] completion:NULL];
}

#pragma mark - ABI32_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI32_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactABI32_0_0Tag)rootTag
{
  ABI32_0_0RCTIsMainQueue();
  // TODO: Propagate state change to Surface.
}

- (void)mountingManager:(ABI32_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactABI32_0_0Tag)rootTag
{
  ABI32_0_0RCTIsMainQueue();
  ABI32_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];

  // FIXME: Implement proper state propagation mechanism.
  [surface _setStage:ABI32_0_0RCTSurfaceStageSurfaceDidInitialRendering];
  [surface _setStage:ABI32_0_0RCTSurfaceStageSurfaceDidInitialLayout];
  [surface _setStage:ABI32_0_0RCTSurfaceStageSurfaceDidInitialMounting];

  UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];

  surface.view.rootView = (ABI32_0_0RCTSurfaceRootView *)rootComponentView;
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  // TODO: Define a lifecycle contract for the pieces involved here including the scheduler, mounting manager, and
  // the surface registry. For now simply recreate the scheduler on reload.
  // The goal is to deallocate the Scheduler and its underlying references before the JS runtime is destroyed.
  _scheduler = [[ABI32_0_0RCTScheduler alloc] init];
  _scheduler.delegate = self;
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  ABI32_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _batchedBridge) {
    _batchedBridge = bridge;
  }
}

@end

@implementation ABI32_0_0RCTSurfacePresenter (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler.uiManager_DO_NOT_USE;
}

- (ABI32_0_0RCTBridge *)bridge_DO_NOT_USE
{
  return _bridge;
}

@end

@implementation ABI32_0_0RCTBridge (ABI32_0_0RCTSurfacePresenter)

- (ABI32_0_0RCTSurfacePresenter *)surfacePresenter
{
  return [self jsBoundExtraModuleForClass:[ABI32_0_0RCTSurfacePresenter class]];
}

@end
