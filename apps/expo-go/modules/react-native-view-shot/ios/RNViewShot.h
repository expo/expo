#import <React/RCTBridgeModule.h>
#ifdef RCT_NEW_ARCH_ENABLED
#import <rnviewshot/rnviewshot.h>
#import <ReactCommon/RCTTurboModule.h>
#endif

@interface RNViewShot : NSObject <RCTBridgeModule
#ifdef RCT_NEW_ARCH_ENABLED
, NativeRNViewShotSpec
#endif
>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface RNViewShot () <RCTTurboModule>

@end
#endif
  