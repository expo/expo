#if ABI49_0_0REACT_NATIVE_MINOR_VERSION >= 72 && !defined(ABI49_0_0RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <Foundation/Foundation.h>

#if __has_include(<ABI49_0_0React-RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)
#import <ABI49_0_0React-RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>
#elif __has_include(<ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>
#endif

#if __has_include(<ABI49_0_0React-cxxreact/ABI49_0_0cxxreact/ABI49_0_0JSExecutor.h>)
#import <ABI49_0_0React-cxxreact/ABI49_0_0cxxreact/ABI49_0_0JSExecutor.h>
#elif __has_include(<cxxreact/JSExecutor.h>)
// for importing the header from framework, "ABI49_0_0React-cxxreact" will be omitted
#import <cxxreact/JSExecutor.h>
#endif

@interface ABI49_0_0RCTAppDelegate (Reanimated)

- (std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory>)reanimated_jsExecutorFactoryForBridge:(ABI49_0_0RCTBridge *)bridge;

@end

#endif
