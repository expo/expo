// Copyright 2015-present 650 Industries. All rights reserved.

#import "DevMenuBaseAppInstance.h"

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
typedef facebook::react::HermesExecutorFactory ExecutorFactory;
#elif __has_include(<React/HermesExecutorFactory.h>)
#import <React/HermesExecutorFactory.h>
typedef facebook::react::HermesExecutorFactory ExecutorFactory;
#else
#import <React/JSCExecutorFactory.h>
typedef facebook::react::JSCExecutorFactory ExecutorFactory;
#endif

#import "DevMenuREAInitializer.h"

#import <React/RCTCxxBridgeDelegate.h>
//#import <EXDevMenu-Swift.h>

// Empty implementation of DevMenuBaseAppInstance to satisfy compiler
@implementation DevMenuBaseAppInstance

@end

// Reanimated installer can't be directly use in the Swift code, cause it uses c++ code.
// So we use an extension to inject it to the base class of DevMenuAppInstance which was written in Swift.
@interface DevMenuBaseAppInstance (Reanimated) <RCTCxxBridgeDelegate>

@end

@implementation DevMenuBaseAppInstance (Reanimated)

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  const auto installer = devmenureanimated::DevMenuREAJSIExecutorRuntimeInstaller(bridge, NULL);

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  auto executorFactory = std::make_unique<ExecutorFactory>(RCTJSIExecutorRuntimeInstaller(installer));
#else
  auto executorFactory = std::make_unique<ExecutorFactory>(installer);
#endif

#if (RNVERSION > 70 || (RNVERSION >= 70 && RNPATCHVERSION >= 1)) && (__has_include(<reacthermes/HermesExecutorFactory.h>) || __has_include(<React/HermesExecutorFactory.h>))
  executorFactory->setEnableDebugger(false);
#endif
  
  return executorFactory;
}

@end
