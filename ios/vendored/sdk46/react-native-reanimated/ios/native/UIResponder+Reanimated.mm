#import <ABI46_0_0RNReanimated/ABI46_0_0REAInitializer.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAUIManager.h>
#import <ABI46_0_0RNReanimated/UIResponder+Reanimated.h>

#if __has_include(<reacthermes/ABI46_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI46_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<ABI46_0_0React/ABI46_0_0HermesExecutorFactory.h>)
#import <ABI46_0_0React/ABI46_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI46_0_0React/ABI46_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI46_0_0facebook::ABI46_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI46_0_0RCTBridge *)bridge
{
  const auto installer = ABI46_0_0reanimated::ABI46_0_0REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI46_0_0RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
