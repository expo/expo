/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTScheduler.h"

#import <ReactABI34_0_0/debug/SystraceSection.h>
#import <ReactABI34_0_0/uimanager/ComponentDescriptorFactory.h>
#import <ReactABI34_0_0/uimanager/ContextContainer.h>
#import <ReactABI34_0_0/uimanager/Scheduler.h>
#import <ReactABI34_0_0/uimanager/SchedulerDelegate.h>

#import <ReactABI34_0_0/ABI34_0_0RCTFollyConvert.h>

#import "ABI34_0_0RCTConversions.h"

using namespace facebook::ReactABI34_0_0;

class SchedulerDelegateProxy: public SchedulerDelegate {
public:
  SchedulerDelegateProxy(void *scheduler):
    scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(Tag rootTag, const ShadowViewMutationList &mutations, const long commitStartTime, const long layoutTime) override {
    ABI34_0_0RCTScheduler *scheduler = (__bridge ABI34_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mutations rootTag:rootTag];
  }

  void schedulerDidRequestPreliminaryViewAllocation(SurfaceId surfaceId, ComponentName componentName, bool isLayoutable, ComponentHandle componentHandle) override {
    if (!isLayoutable) {
      return;
    }

    ABI34_0_0RCTScheduler *scheduler = (__bridge ABI34_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerOptimisticallyCreateComponentViewWithComponentHandle:componentHandle];
  }

private:
  void *scheduler_;
};

@implementation ABI34_0_0RCTScheduler {
  std::shared_ptr<Scheduler> _scheduler;
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
}

- (instancetype)initWithContextContainer:(std::shared_ptr<void>)contextContainer
{
  if (self = [super init]) {
    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);
    _scheduler = std::make_shared<Scheduler>(std::static_pointer_cast<ContextContainer>(contextContainer), getDefaultComponentRegistryFactory());
    _scheduler->setDelegate(_delegateProxy.get());
  }

  return self;
}

- (void)dealloc
{
  _scheduler->setDelegate(nullptr);
}

- (void)startSurfaceWithSurfaceId:(SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initailProps:(NSDictionary *)initialProps
                layoutConstraints:(LayoutConstraints)layoutConstraints
                    layoutContext:(LayoutContext)layoutContext;
{
  SystraceSection s("-[ABI34_0_0RCTScheduler startSurfaceWithSurfaceId:...]");

  auto props = convertIdToFollyDynamic(initialProps);
  _scheduler->startSurface(
      surfaceId,
      ABI34_0_0RCTStringFromNSString(moduleName),
      props,
      layoutConstraints,
      layoutContext);
  _scheduler->renderTemplateToSurface(
      surfaceId,
      props.getDefault("navigationConfig")
          .getDefault("initialUITemplate", "")
          .getString());
}

- (void)stopSurfaceWithSurfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI34_0_0RCTScheduler stopSurfaceWithSurfaceId:]");
  _scheduler->stopSurface(surfaceId);
}

- (CGSize)measureSurfaceWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                layoutContext:(LayoutContext)layoutContext
                                    surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI34_0_0RCTScheduler measureSurfaceWithLayoutConstraints:]");
  return ABI34_0_0RCTCGSizeFromSize(_scheduler->measureSurface(surfaceId, layoutConstraints, layoutContext));
}

- (void)constraintSurfaceLayoutWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                       layoutContext:(LayoutContext)layoutContext
                                           surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("-[ABI34_0_0RCTScheduler constraintSurfaceLayoutWithLayoutConstraints:]");
  _scheduler->constraintSurfaceLayout(surfaceId, layoutConstraints, layoutContext);
}

@end
