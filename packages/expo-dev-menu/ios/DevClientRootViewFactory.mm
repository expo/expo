// Copyright 2018-present 650 Industries. All rights reserved.

#import "DevClientRootViewFactory.h"
#import <EXDevMenu/DevMenuRCTBridge.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#endif

#import <React/RCTCxxBridgeDelegate.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

@interface RCTRootViewFactory () <RCTCxxBridgeDelegate> {
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation DevClientRootViewFactory

- (void)createBridgeIfNeeded:(NSDictionary *)launchOptions
{
  if (self.bridge != nil) {
    return;
  }

  self.bridge = [[DevMenuRCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
}

#pragma mark - RCTCxxBridgeDelegate
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  std::unique_ptr<facebook::react::JSExecutorFactory> executorFactory  = [super jsExecutorFactoryForBridge:bridge];

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
  auto rawExecutorFactory = executorFactory.get();
  auto hermesExecFactory = dynamic_cast<facebook::react::HermesExecutorFactory*>(rawExecutorFactory);
  if (hermesExecFactory != nullptr) {
    hermesExecFactory->setEnableDebugger(false);
  }
#endif

  return executorFactory;
}

@end
