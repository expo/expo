#if ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71 && !defined(ABI49_0_0RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <ABI49_0_0RNReanimated/ABI49_0_0REAInitializer.h>
#import <ABI49_0_0RNReanimated/UIResponder+Reanimated.h>

#if __has_include(<reacthermes/ABI49_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI49_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<ABI49_0_0React/ABI49_0_0HermesExecutorFactory.h>)
#import <ABI49_0_0React/ABI49_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI49_0_0React/ABI49_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI49_0_0RCTBridge *)bridge
{
  const auto installer = ABI49_0_0reanimated::ABI49_0_0REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if ABI49_0_0REACT_NATIVE_MINOR_VERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI49_0_0RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
