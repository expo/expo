#if REACT_NATIVE_MINOR_VERSION >= 72 && !defined(RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <Foundation/Foundation.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

#if __has_include(<React-cxxreact/cxxreact/JSExecutor.h>)
#import <React-cxxreact/cxxreact/JSExecutor.h>
#elif __has_include(<cxxreact/JSExecutor.h>)
// for importing the header from framework, "React-cxxreact" will be omitted
#import <cxxreact/JSExecutor.h>
#endif

@interface RCTAppDelegate (Reanimated)

- (std::unique_ptr<facebook::react::JSExecutorFactory>)reanimated_jsExecutorFactoryForBridge:(RCTBridge *)bridge;

@end

#endif
