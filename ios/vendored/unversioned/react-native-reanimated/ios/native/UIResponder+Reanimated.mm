#if REACT_NATIVE_MINOR_VERSION <= 71 && !defined(RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <RNReanimated/REAInitializer.h>
#import <RNReanimated/UIResponder+Reanimated.h>

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<React/HermesExecutorFactory.h>)
#import <React/HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <React/JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

@implementation UIResponder (Reanimated)
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  const auto installer = reanimated::REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if REACT_NATIVE_MINOR_VERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
