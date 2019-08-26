#import <ReactABI31_0_0/ABI31_0_0RCTView.h>
#import <ReactABI31_0_0/ABI31_0_0RCTComponent.h>

@interface ABI31_0_0EXBannerView : ABI31_0_0RCTView

@property (nonatomic, copy) ABI31_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI31_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
