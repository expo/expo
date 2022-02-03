/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTScheduler.h"

#import <ABI43_0_0React/ABI43_0_0renderer/animations/LayoutAnimationDriver.h>
#import <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI43_0_0React/ABI43_0_0renderer/debug/SystraceSection.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/Scheduler.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/SchedulerDelegate.h>
#include <ABI43_0_0React/ABI43_0_0utils/RunLoopObserver.h>

#import <ABI43_0_0React/ABI43_0_0RCTFollyConvert.h>

#import "ABI43_0_0RCTConversions.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

class SchedulerDelegateProxy : public SchedulerDelegate {
 public:
  SchedulerDelegateProxy(void *scheduler) : scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(MountingCoordinator::Shared const &mountingCoordinator) override
  {
    ABI43_0_0RCTScheduler *scheduler = (__bridge ABI43_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mountingCoordinator];
  }

  void schedulerDidRequestPreliminaryViewAllocation(SurfaceId surfaceId, const ShadowView &shadowView) override
  {
    // Does nothing.
    // Preemptive allocation of native views on iOS does not require this call.
  }

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic args) override
  {
    ABI43_0_0RCTScheduler *scheduler = (__bridge ABI43_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidDispatchCommand:shadowView commandName:commandName args:args];
  }

  void schedulerDidSetJSResponder(
      SurfaceId surfaceId,
      const ShadowView &shadowView,
      const ShadowView &initialShadowView,
      bool blockNativeResponder) override
  {
    // Does nothing for now.
  }

  void schedulerDidClearJSResponder() override
  {
    // Does nothing for now.
  }

 private:
  void *scheduler_;
};

class LayoutAnimationDelegateProxy : public LayoutAnimationStatusDelegate, public RunLoopObserver::Delegate {
 public:
  LayoutAnimationDelegateProxy(void *scheduler) : scheduler_(scheduler) {}
  virtual ~LayoutAnimationDelegateProxy() {}

  void onAnimationStarted() override
  {
    ABI43_0_0RCTScheduler *scheduler = (__bridge ABI43_0_0RCTScheduler *)scheduler_;
    [scheduler onAnimationStarted];
  }

  /**
   * Called when the LayoutAnimation engine completes all pending animations.
   */
  void onAllAnimationsComplete() override
  {
    ABI43_0_0RCTScheduler *scheduler = (__bridge ABI43_0_0RCTScheduler *)scheduler_;
    [scheduler onAllAnimationsComplete];
  }

  void activityDidChange(RunLoopObserver::Delegate const *delegate, RunLoopObserver::Activity activity) const
      noexcept override
  {
    ABI43_0_0RCTScheduler *scheduler = (__bridge ABI43_0_0RCTScheduler *)scheduler_;
    [scheduler animationTick];
  }

 private:
  void *scheduler_;
};

@implementation ABI43_0_0RCTScheduler {
  std::unique_ptr<Scheduler> _scheduler;
  std::shared_ptr<LayoutAnimationDriver> _animationDriver;
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
  std::shared_ptr<LayoutAnimationDelegateProxy> _layoutAnimationDelegateProxy;
  RunLoopObserver::Unique _uiRunLoopObserver;
  BOOL _layoutAnimationsEnabled;
}

- (instancetype)initWithToolbox:(ABI43_0_0facebook::ABI43_0_0React::SchedulerToolbox)toolbox
{
  if (self = [super init]) {
    auto ABI43_0_0ReactNativeConfig =
        toolbox.contextContainer->at<std::shared_ptr<const ABI43_0_0ReactNativeConfig>>("ABI43_0_0ReactNativeConfig");
    _layoutAnimationsEnabled = ABI43_0_0ReactNativeConfig->getBool("ABI43_0_0React_fabric:enabled_layout_animations_ios");

    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);

    if (_layoutAnimationsEnabled) {
      _layoutAnimationDelegateProxy = std::make_shared<LayoutAnimationDelegateProxy>((__bridge void *)self);
      _animationDriver =
          std::make_shared<LayoutAnimationDriver>(toolbox.runtimeExecutor, _layoutAnimationDelegateProxy.get());
      _uiRunLoopObserver =
          toolbox.mainRunLoopObserverFactory(RunLoopObserver::Activity::BeforeWaiting, _layoutAnimationDelegateProxy);
      _uiRunLoopObserver->setDelegate(_layoutAnimationDelegateProxy.get());
    }

    _scheduler = std::make_unique<Scheduler>(
        toolbox, (_animationDriver ? _animationDriver.get() : nullptr), _delegateProxy.get());
  }

  return self;
}

- (void)animationTick
{
  _scheduler->animationTick();
}

- (void)dealloc
{
  if (_animationDriver) {
    _animationDriver->setLayoutAnimationStatusDelegate(nullptr);
  }
  _animationDriver = nullptr;
}

- (void)startSurfaceWithSurfaceId:(SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(LayoutConstraints)layoutConstraints
                    layoutContext:(LayoutContext)layoutContext
{
  SystraceSection s("-[ABI43_0_0RCTScheduler startSurfaceWithSurfaceId:...]");

  auto props = convertIdToFollyDynamic(initialProps);
  _scheduler->startSurface(
      surfaceId, ABI43_0_0RCTStringFromNSString(moduleName), props, layoutConstraints, layoutContext, _animationDriver);
  _scheduler->renderTemplateToSurface(
      surfaceId, props.getDefault("navigationConfig").getDefault("initialUITemplate", "").getString());
}

- (void)stopSurfaceWithSurfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI43_0_0RCTScheduler stopSurfaceWithSurfaceId:]");
  _scheduler->stopSurface(surfaceId);
}

- (CGSize)measureSurfaceWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                layoutContext:(LayoutContext)layoutContext
                                    surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI43_0_0RCTScheduler measureSurfaceWithLayoutConstraints:]");
  return ABI43_0_0RCTCGSizeFromSize(_scheduler->measureSurface(surfaceId, layoutConstraints, layoutContext));
}

- (void)constraintSurfaceLayoutWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                       layoutContext:(LayoutContext)layoutContext
                                           surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI43_0_0RCTScheduler constraintSurfaceLayoutWithLayoutConstraints:]");
  _scheduler->constraintSurfaceLayout(surfaceId, layoutConstraints, layoutContext);
}

- (ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:(ComponentHandle)handle
{
  return _scheduler->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

- (MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(SurfaceId)surfaceId
{
  return _scheduler->findMountingCoordinator(surfaceId);
}

- (void)onAnimationStarted
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->enable();
  }
}

- (void)onAllAnimationsComplete
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->disable();
  }
}

@end
