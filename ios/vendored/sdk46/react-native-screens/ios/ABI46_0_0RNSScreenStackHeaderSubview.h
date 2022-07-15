
#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTViewComponentView.h>
#endif

#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#import "ABI46_0_0RNSEnums.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0RNSScreenStackHeaderSubview :
#ifdef RN_FABRIC_ENABLED
    ABI46_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic) ABI46_0_0RNSScreenStackHeaderSubviewType type;

@property (nonatomic, weak) UIView *ABI46_0_0ReactSuperview;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, weak) ABI46_0_0RCTBridge *bridge;

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge;

#endif

@end

@interface ABI46_0_0RNSScreenStackHeaderSubviewManager : ABI46_0_0RCTViewManager

@property (nonatomic) ABI46_0_0RNSScreenStackHeaderSubviewType type;

@end

@interface ABI46_0_0RCTConvert (ABI46_0_0RNSScreenStackHeaderSubview)

+ (ABI46_0_0RNSScreenStackHeaderSubviewType)ABI46_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

NS_ASSUME_NONNULL_END
