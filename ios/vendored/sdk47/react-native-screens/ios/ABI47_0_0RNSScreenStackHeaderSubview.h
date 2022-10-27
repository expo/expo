
#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#endif

#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import "ABI47_0_0RNSEnums.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RNSScreenStackHeaderSubview :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic) ABI47_0_0RNSScreenStackHeaderSubviewType type;

@property (nonatomic, weak) UIView *ABI47_0_0ReactSuperview;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, weak) ABI47_0_0RCTBridge *bridge;

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge;

#endif

@end

@interface ABI47_0_0RNSScreenStackHeaderSubviewManager : ABI47_0_0RCTViewManager

@property (nonatomic) ABI47_0_0RNSScreenStackHeaderSubviewType type;

@end

@interface ABI47_0_0RCTConvert (ABI47_0_0RNSScreenStackHeaderSubview)

+ (ABI47_0_0RNSScreenStackHeaderSubviewType)ABI47_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

NS_ASSUME_NONNULL_END
