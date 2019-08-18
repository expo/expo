#import <ReactABI32_0_0/ABI32_0_0RCTView.h>
#import <ReactABI32_0_0/ABI32_0_0RCTComponent.h>

@interface ABI32_0_0EXBannerView : ABI32_0_0RCTView

@property (nonatomic, copy) ABI32_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI32_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
