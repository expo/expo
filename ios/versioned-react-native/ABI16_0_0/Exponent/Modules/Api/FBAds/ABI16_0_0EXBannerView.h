#import <ReactABI16_0_0/ABI16_0_0RCTView.h>
#import <ReactABI16_0_0/ABI16_0_0RCTComponent.h>

@interface ABI16_0_0EXBannerView : ABI16_0_0RCTView

@property (nonatomic, copy) ABI16_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI16_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
