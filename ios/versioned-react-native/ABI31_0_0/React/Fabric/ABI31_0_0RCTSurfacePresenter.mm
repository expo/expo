/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSurfacePresenter.h"

#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTBridge+Private.h>
#import <ReactABI31_0_0/ABI31_0_0RCTComponentViewRegistry.h>
#import <ReactABI31_0_0/ABI31_0_0RCTFabricSurface.h>
#import <ReactABI31_0_0/ABI31_0_0RCTMountingManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTMountingManagerDelegate.h>
#import <ReactABI31_0_0/ABI31_0_0RCTScheduler.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceRegistry.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceView.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceView+Internal.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUtils.h>
#import <ABI31_0_0fabric/ABI31_0_0core/LayoutContext.h>
#import <ABI31_0_0fabric/ABI31_0_0core/LayoutConstraints.h>

#import "ABI31_0_0RCTConversions.h"

using namespace facebook::ReactABI31_0_0;

@interface ABI31_0_0RCTSurfacePresenter () <ABI31_0_0RCTSchedulerDelegate, ABI31_0_0RCTMountingManagerDelegate>
@end

@implementation ABI31_0_0RCTSurfacePresenter {
  ABI31_0_0RCTScheduler *_scheduler;
  ABI31_0_0RCTMountingManager *_mountingManager;
  ABI31_0_0RCTBridge *_bridge;
  ABI31_0_0RCTBridge *_batchedBridge;
  ABI31_0_0RCTSurfaceRegistry *_surfaceRegistry;
}

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    _scheduler = [[ABI31_0_0RCTScheduler alloc] init];
    _scheduler.delegate = self;

    _surfaceRegistry = [[ABI31_0_0RCTSurfaceRegistry alloc] init];
    _mountingManager = [[ABI31_0_0RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillReloadNotification:)
                                                 name:ABI31_0_0RCTBridgeWillReloadNotification
                                               object:_bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptDidLoadNotification:)
                                                 name:ABI31_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - ABI31_0_0RCTSchedulerDelegate

- (void)schedulerDidComputeMutationInstructions:(facebook::ReactABI31_0_0::TreeMutationInstructionList)instructions
                                        rootTag:(ReactABI31_0_0Tag)rootTag
{
  [_mountingManager mutateComponentViewTreeWithMutationInstructions:instructions
                                                            rootTag:rootTag];
}

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName
{
  [_mountingManager preliminaryCreateComponentViewWithName:componentName];
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  [_scheduler registerRootTag:surface.rootTag];
  [self runSurface:surface];

  // FIXME: Mutation instruction MUST produce instruction for root node.
  [_mountingManager.componentViewRegistry dequeueComponentViewWithName:@"Root" tag:surface.rootTag];
}

- (void)unregisterSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  [self stopSurface:surface];
  [_scheduler unregisterRootTag:surface.rootTag];
  [_surfaceRegistry unregisterSurface:surface];
}

- (ABI31_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI31_0_0Tag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI31_0_0RCTFabricSurface *)surface
{
  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = ABI31_0_0RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = ABI31_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI31_0_0RCTSizeFromCGSize(maximumSize);

  return [_scheduler measureWithLayoutConstraints:layoutConstraints
                                    layoutContext:layoutContext
                                          rootTag:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
               surface:(ABI31_0_0RCTFabricSurface *)surface
{
  LayoutContext layoutContext;
  layoutContext.pointScaleFactor = ABI31_0_0RCTScreenScale();
  LayoutConstraints layoutConstraints = {};
  layoutConstraints.minimumSize = ABI31_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI31_0_0RCTSizeFromCGSize(maximumSize);

  [_scheduler constraintLayoutWithLayoutConstraints:layoutConstraints
                                      layoutContext:layoutContext
                                            rootTag:surface.rootTag];
}

- (void)runSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  NSDictionary *applicationParameters = @{
    @"rootTag": @(surface.rootTag),
    @"initialProps": surface.properties,
  };

  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[surface.moduleName, applicationParameters] completion:NULL];
}

- (void)stopSurface:(ABI31_0_0RCTFabricSurface *)surface
{
  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"unmountApplicationComponentAtRootTag" args:@[@(surface.rootTag)] completion:NULL];
}

#pragma mark - ABI31_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI31_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactABI31_0_0Tag)rootTag
{
  ABI31_0_0RCTIsMainQueue();
  // TODO: Propagate state change to Surface.
}

- (void)mountingManager:(ABI31_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactABI31_0_0Tag)rootTag
{
  ABI31_0_0RCTIsMainQueue();
  ABI31_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];

  // FIXME: Implement proper state propagation mechanism.
  [surface _setStage:ABI31_0_0RCTSurfaceStageSurfaceDidInitialRendering];
  [surface _setStage:ABI31_0_0RCTSurfaceStageSurfaceDidInitialLayout];
  [surface _setStage:ABI31_0_0RCTSurfaceStageSurfaceDidInitialMounting];

  UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];

  surface.view.rootView = (ABI31_0_0RCTSurfaceRootView *)rootComponentView;
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  // TODO: Define a lifecycle contract for the pieces involved here including the scheduler, mounting manager, and
  // the surface registry. For now simply recreate the scheduler on reload.
  // The goal is to deallocate the Scheduler and its underlying references before the JS runtime is destroyed.
  _scheduler = [[ABI31_0_0RCTScheduler alloc] init];
  _scheduler.delegate = self;
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  ABI31_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _batchedBridge) {
    _batchedBridge = bridge;
  }
}

@end

@implementation ABI31_0_0RCTSurfacePresenter (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler.uiManager_DO_NOT_USE;
}

- (ABI31_0_0RCTBridge *)bridge_DO_NOT_USE
{
  return _bridge;
}

@end

@implementation ABI31_0_0RCTBridge (ABI31_0_0RCTSurfacePresenter)

- (ABI31_0_0RCTSurfacePresenter *)surfacePresenter
{
  return [self jsBoundExtraModuleForClass:[ABI31_0_0RCTSurfacePresenter class]];
}

@end
