#if ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71 && !defined(ABI49_0_0RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTCxxBridgeDelegate.h>

@interface UIResponder (Reanimated) <ABI49_0_0RCTCxxBridgeDelegate>

@end

#endif