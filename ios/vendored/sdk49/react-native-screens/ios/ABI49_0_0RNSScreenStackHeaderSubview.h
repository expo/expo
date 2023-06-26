
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#endif

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#import "ABI49_0_0RNSEnums.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RNSScreenStackHeaderSubview :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic) ABI49_0_0RNSScreenStackHeaderSubviewType type;

@property (nonatomic, weak) UIView *ABI49_0_0ReactSuperview;

@property (nonatomic, weak) ABI49_0_0RCTBridge *bridge;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@end

@interface ABI49_0_0RNSScreenStackHeaderSubviewManager : ABI49_0_0RCTViewManager

@property (nonatomic) ABI49_0_0RNSScreenStackHeaderSubviewType type;

@end

@interface ABI49_0_0RCTConvert (ABI49_0_0RNSScreenStackHeaderSubview)

+ (ABI49_0_0RNSScreenStackHeaderSubviewType)ABI49_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

NS_ASSUME_NONNULL_END
