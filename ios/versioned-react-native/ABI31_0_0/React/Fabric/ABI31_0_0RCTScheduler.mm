/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTScheduler.h"

#import <ABI31_0_0fabric/ABI31_0_0imagemanager/ImageManager.h>
#import <ABI31_0_0fabric/ABI31_0_0uimanager/ContextContainer.h>
#import <ABI31_0_0fabric/ABI31_0_0uimanager/Scheduler.h>
#import <ABI31_0_0fabric/ABI31_0_0uimanager/SchedulerDelegate.h>
#import <ReactABI31_0_0/ABI31_0_0RCTImageLoader.h>
#import <ReactABI31_0_0/ABI31_0_0RCTBridge+Private.h>

#import "ABI31_0_0RCTConversions.h"

using namespace facebook::ReactABI31_0_0;

class SchedulerDelegateProxy: public SchedulerDelegate {
public:
  SchedulerDelegateProxy(void *scheduler): scheduler_(scheduler) {}

  void schedulerDidComputeMutationInstructions(Tag rootTag, const TreeMutationInstructionList &instructions) override {
    ABI31_0_0RCTScheduler *scheduler = (__bridge ABI31_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidComputeMutationInstructions:instructions rootTag:rootTag];
  }

  void schedulerDidRequestPreliminaryViewAllocation(ComponentName componentName) override {
    ABI31_0_0RCTScheduler *scheduler = (__bridge ABI31_0_0RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidRequestPreliminaryViewAllocationWithComponentName:ABI31_0_0RCTNSStringFromString(componentName, NSASCIIStringEncoding)];
  }

private:
  void *scheduler_;
};

@implementation ABI31_0_0RCTScheduler {
  std::shared_ptr<Scheduler> _scheduler;
  std::shared_ptr<SchedulerDelegateProxy> _delegateProxy;
}

- (instancetype)init
{
  if (self = [super init]) {
    _delegateProxy = std::make_shared<SchedulerDelegateProxy>((__bridge void *)self);

    SharedContextContainer contextContainer = std::make_shared<ContextContainer>();

    void *imageLoader = (__bridge void *)[[ABI31_0_0RCTBridge currentBridge] imageLoader];
    contextContainer->registerInstance(std::make_shared<ImageManager>(imageLoader));

    _scheduler = std::make_shared<Scheduler>(contextContainer);
    _scheduler->setDelegate(_delegateProxy.get());
  }

  return self;
}

- (void)dealloc
{
  _scheduler->setDelegate(nullptr);
}

- (void)registerRootTag:(ReactABI31_0_0Tag)tag
{
  _scheduler->registerRootTag(tag);
}

- (void)unregisterRootTag:(ReactABI31_0_0Tag)tag
{
  _scheduler->unregisterRootTag(tag);
}

- (CGSize)measureWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                         layoutContext:(LayoutContext)layoutContext
                               rootTag:(ReactABI31_0_0Tag)rootTag
{
  return ABI31_0_0RCTCGSizeFromSize(_scheduler->measure(rootTag, layoutConstraints, layoutContext));
}

- (void)constraintLayoutWithLayoutConstraints:(LayoutConstraints)layoutConstraints
                                layoutContext:(LayoutContext)layoutContext
                                      rootTag:(ReactABI31_0_0Tag)rootTag
{
  _scheduler->constraintLayout(rootTag, layoutConstraints, layoutContext);
}

@end

@implementation ABI31_0_0RCTScheduler (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler->getUIManager_DO_NOT_USE();
}

@end
