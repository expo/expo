#import <React/RCTBridgeModule.h>
#ifdef RCT_NEW_ARCH_ENABLED
#import <rnviewshot/rnviewshot.h>
#endif

@interface RNViewShot : NSObject <RCTBridgeModule>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface RNViewShot () <NativeRNViewShotSpec>

@end
#endif
  