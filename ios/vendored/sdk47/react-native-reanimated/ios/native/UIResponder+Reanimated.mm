#import <ABI47_0_0RNReanimated/ABI47_0_0REAInitializer.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAUIManager.h>
#import <ABI47_0_0RNReanimated/UIResponder+Reanimated.h>

#if __has_include(<reacthermes/ABI47_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI47_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<ABI47_0_0React/ABI47_0_0HermesExecutorFactory.h>)
#import <ABI47_0_0React/ABI47_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI47_0_0React/ABI47_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI47_0_0facebook::ABI47_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI47_0_0RCTBridge *)bridge
{
  const auto installer = ABI47_0_0reanimated::ABI47_0_0REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if REACT_NATIVE_MINOR_VERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI47_0_0RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
