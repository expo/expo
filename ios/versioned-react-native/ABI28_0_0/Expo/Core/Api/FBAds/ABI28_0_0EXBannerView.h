#import <ReactABI28_0_0/ABI28_0_0RCTView.h>
#import <ReactABI28_0_0/ABI28_0_0RCTComponent.h>

@interface ABI28_0_0EXBannerView : ABI28_0_0RCTView

@property (nonatomic, copy) ABI28_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI28_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
