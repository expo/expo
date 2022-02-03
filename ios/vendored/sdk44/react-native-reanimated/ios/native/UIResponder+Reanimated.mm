#import "ABI44_0_0REAInitializer.h"
#import "ABI44_0_0REAUIManager.h"
#import "UIResponder+Reanimated.h"

#if __has_include(<reacthermes/ABI44_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI44_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#elif __has_include(<ABI44_0_0React/ABI44_0_0HermesExecutorFactory.h>)
#import <ABI44_0_0React/ABI44_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI44_0_0React/ABI44_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI44_0_0facebook::ABI44_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI44_0_0RCTBridge *)bridge
{
  const auto installer = ABI44_0_0reanimated::ABI44_0_0REAJSIExecutorRuntimeInstaller(bridge, NULL);

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI44_0_0RCTJSIExecutorRuntimeInstaller(installer));
#else
  return std::make_unique<ExecutorFactory>(installer);
#endif
}

@end

#endif
