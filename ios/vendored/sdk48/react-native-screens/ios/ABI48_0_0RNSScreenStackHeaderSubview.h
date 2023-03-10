
#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>
#endif

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import "ABI48_0_0RNSEnums.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0RNSScreenStackHeaderSubview :
#ifdef RN_FABRIC_ENABLED
    ABI48_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic) ABI48_0_0RNSScreenStackHeaderSubviewType type;

@property (nonatomic, weak) UIView *ABI48_0_0ReactSuperview;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, weak) ABI48_0_0RCTBridge *bridge;

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge;

#endif

@end

@interface ABI48_0_0RNSScreenStackHeaderSubviewManager : ABI48_0_0RCTViewManager

@property (nonatomic) ABI48_0_0RNSScreenStackHeaderSubviewType type;

@end

@interface ABI48_0_0RCTConvert (ABI48_0_0RNSScreenStackHeaderSubview)

+ (ABI48_0_0RNSScreenStackHeaderSubviewType)ABI48_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

NS_ASSUME_NONNULL_END
