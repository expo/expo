#import <ABI45_0_0RNReanimated/ABI45_0_0REAInitializer.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAUIManager.h>
#import <ABI45_0_0RNReanimated/UIResponder+Reanimated.h>

#if __has_include(<reacthermes/ABI45_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI45_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<ABI45_0_0React/ABI45_0_0HermesExecutorFactory.h>)
#import <ABI45_0_0React/ABI45_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI45_0_0React/ABI45_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI45_0_0facebook::ABI45_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI45_0_0RCTBridge *)bridge
{
  const auto installer = ABI45_0_0reanimated::ABI45_0_0REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI45_0_0RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
