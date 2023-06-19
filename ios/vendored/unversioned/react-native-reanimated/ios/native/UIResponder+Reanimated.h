#if REACT_NATIVE_MINOR_VERSION <= 71 && !defined(RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <Foundation/Foundation.h>
#import <React/RCTCxxBridgeDelegate.h>

@interface UIResponder (Reanimated) <RCTCxxBridgeDelegate>

@end

#endif