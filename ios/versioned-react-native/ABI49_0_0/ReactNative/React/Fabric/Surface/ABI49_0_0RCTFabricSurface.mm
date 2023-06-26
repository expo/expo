/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTFabricSurface.h"

#import <mutex>

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConstants.h>
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFollyConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTI18nUtil.h>
#import <ABI49_0_0React/ABI49_0_0RCTMountingManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceDelegate.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceRootView.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceTouchHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceView+Internal.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceView.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingCoordinator.h>

#import "ABI49_0_0RCTSurfacePresenter.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation ABI49_0_0RCTFabricSurface {
  __weak ABI49_0_0RCTSurfacePresenter *_surfacePresenter;

  // `SurfaceHandler` is a thread-safe object, so we don't need additional synchronization.
  // Objective-C++ classes cannot have instance variables without default constructors,
  // hence we wrap a value into `optional` to workaround it.
  std::optional<SurfaceHandler> _surfaceHandler;

  // Protects Surface's start and stop processes.
  // Even though SurfaceHandler is tread-safe, it will crash if we try to stop a surface that is not running.
  // To make the API easy to use, we check the status of the surface before calling `start` or `stop`,
  // and we need this mutex to prevent races.
  std::mutex _surfaceMutex;

  // Can be accessed from the main thread only.
  ABI49_0_0RCTSurfaceView *_Nullable _view;
  ABI49_0_0RCTSurfaceTouchHandler *_Nullable _touchHandler;
}

@synthesize delegate = _delegate;

- (instancetype)initWithSurfacePresenter:(ABI49_0_0RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties
{
  if (self = [super init]) {
    _surfacePresenter = surfacePresenter;

    _surfaceHandler =
        SurfaceHandler{ABI49_0_0RCTStringFromNSString(moduleName), (SurfaceId)[ABI49_0_0RCTAllocateRootViewTag() integerValue]};
    _surfaceHandler->setProps(convertIdToFollyDynamic(initialProperties));

    [_surfacePresenter registerSurface:self];

    [self setMinimumSize:CGSizeZero maximumSize:ABI49_0_0RCTViewportSize()];

    [self _updateLayoutContext];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleContentSizeCategoryDidChangeNotification:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
  }

  return self;
}

- (void)resetWithSurfacePresenter:(ABI49_0_0RCTSurfacePresenter *)surfacePresenter
{
  _view = nil;
  _surfacePresenter = surfacePresenter;
  [_surfacePresenter registerSurface:self];
}

- (void)dealloc
{
  [_surfacePresenter unregisterSurface:self];
}

#pragma mark - Life-cycle management

- (void)start
{
  std::lock_guard<std::mutex> lock(_surfaceMutex);

  if (_surfaceHandler->getStatus() != SurfaceHandler::Status::Registered) {
    return;
  }

  // We need to register a root view component here synchronously because right after
  // we start a surface, it can initiate an update that can query the root component.
  ABI49_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    [self->_surfacePresenter.mountingManager attachSurfaceToView:self.view
                                                       surfaceId:self->_surfaceHandler->getSurfaceId()];
  });

  _surfaceHandler->start();
  [self _propagateStageChange];

  [_surfacePresenter setupAnimationDriverWithSurfaceHandler:*_surfaceHandler];
}

- (void)stop
{
  std::lock_guard<std::mutex> lock(_surfaceMutex);

  if (_surfaceHandler->getStatus() != SurfaceHandler::Status::Running) {
    return;
  }

  _surfaceHandler->stop();
  [self _propagateStageChange];

  ABI49_0_0RCTExecuteOnMainQueue(^{
    [self->_surfacePresenter.mountingManager detachSurfaceFromView:self.view
                                                         surfaceId:self->_surfaceHandler->getSurfaceId()];
  });
}

#pragma mark - Immutable Properties (no need to enforce synchronization)

- (NSString *)moduleName
{
  return ABI49_0_0RCTNSStringFromString(_surfaceHandler->getModuleName());
}

#pragma mark - Main-Threaded Routines

- (ABI49_0_0RCTSurfaceView *)view
{
  ABI49_0_0RCTAssertMainQueue();

  if (!_view) {
    _view = [[ABI49_0_0RCTSurfaceView alloc] initWithSurface:(ABI49_0_0RCTSurface *)self];
    _touchHandler = [ABI49_0_0RCTSurfaceTouchHandler new];
    [_touchHandler attachToView:_view];
  }

  return _view;
}

#pragma mark - Stage management

- (ABI49_0_0RCTSurfaceStage)stage
{
  return _surfaceHandler->getStatus() == SurfaceHandler::Status::Running ? ABI49_0_0RCTSurfaceStageRunning
                                                                         : ABI49_0_0RCTSurfaceStagePreparing;
}

- (void)_propagateStageChange
{
  ABI49_0_0RCTSurfaceStage stage = self.stage;

  // Notifying the `delegate`
  id<ABI49_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeStage:)]) {
    [delegate surface:(ABI49_0_0RCTSurface *)self didChangeStage:stage];
  }
}

- (void)_updateLayoutContext
{
  auto layoutConstraints = _surfaceHandler->getLayoutConstraints();
  layoutConstraints.layoutDirection = ABI49_0_0RCTLayoutDirection([[ABI49_0_0RCTI18nUtil sharedInstance] isRTL]);

  auto layoutContext = _surfaceHandler->getLayoutContext();

  layoutContext.pointScaleFactor = ABI49_0_0RCTScreenScale();
  layoutContext.swapLeftAndRightInRTL =
      [[ABI49_0_0RCTI18nUtil sharedInstance] isRTL] && [[ABI49_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL];
  layoutContext.fontSizeMultiplier = ABI49_0_0RCTFontSizeMultiplier();

  _surfaceHandler->constraintLayout(layoutConstraints, layoutContext);
}

#pragma mark - Properties Management

- (NSDictionary *)properties
{
  return convertFollyDynamicToId(_surfaceHandler->getProps());
}

- (void)setProperties:(NSDictionary *)properties
{
  _surfaceHandler->setProps(convertIdToFollyDynamic(properties));
}

#pragma mark - Layout

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize viewportOffset:(CGPoint)viewportOffset
{
  auto layoutConstraints = _surfaceHandler->getLayoutConstraints();
  auto layoutContext = _surfaceHandler->getLayoutContext();

  layoutConstraints.minimumSize = ABI49_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI49_0_0RCTSizeFromCGSize(maximumSize);

  if (!isnan(viewportOffset.x) && !isnan(viewportOffset.y)) {
    layoutContext.viewportOffset = ABI49_0_0RCTPointFromCGPoint(viewportOffset);
  }

  _surfaceHandler->constraintLayout(layoutConstraints, layoutContext);
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  [self setMinimumSize:minimumSize maximumSize:maximumSize viewportOffset:CGPointMake(NAN, NAN)];
}

- (void)setSize:(CGSize)size
{
  [self setMinimumSize:size maximumSize:size];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  auto layoutConstraints = _surfaceHandler->getLayoutConstraints();
  auto layoutContext = _surfaceHandler->getLayoutContext();

  layoutConstraints.minimumSize = ABI49_0_0RCTSizeFromCGSize(minimumSize);
  layoutConstraints.maximumSize = ABI49_0_0RCTSizeFromCGSize(maximumSize);

  return ABI49_0_0RCTCGSizeFromSize(_surfaceHandler->measure(layoutConstraints, layoutContext));
}

- (CGSize)minimumSize
{
  return ABI49_0_0RCTCGSizeFromSize(_surfaceHandler->getLayoutConstraints().minimumSize);
}

- (CGSize)maximumSize
{
  return ABI49_0_0RCTCGSizeFromSize(_surfaceHandler->getLayoutConstraints().maximumSize);
}

- (CGPoint)viewportOffset
{
  return ABI49_0_0RCTCGPointFromPoint(_surfaceHandler->getLayoutContext().viewportOffset);
}

#pragma mark - Synchronous Waiting

- (BOOL)synchronouslyWaitFor:(NSTimeInterval)timeout
{
  auto mountingCoordinator = _surfaceHandler->getMountingCoordinator();

  if (!mountingCoordinator) {
    return NO;
  }

  if (!mountingCoordinator->waitForTransaction(std::chrono::duration<NSTimeInterval>(timeout))) {
    return NO;
  }

  [_surfacePresenter.mountingManager scheduleTransaction:mountingCoordinator];

  return YES;
}

- (void)handleContentSizeCategoryDidChangeNotification:(NSNotification *)notification
{
  [self _updateLayoutContext];
}

#pragma mark - Private

- (SurfaceHandler const &)surfaceHandler;
{
  return *_surfaceHandler;
}

#pragma mark - Deprecated

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  return [self initWithSurfacePresenter:bridge.surfacePresenter
                             moduleName:moduleName
                      initialProperties:initialProperties];
}

- (NSNumber *)rootViewTag
{
  return @(_surfaceHandler->getSurfaceId());
}

- (NSInteger)rootTag
{
  return (NSInteger)(_surfaceHandler->getSurfaceId());
}

@end
