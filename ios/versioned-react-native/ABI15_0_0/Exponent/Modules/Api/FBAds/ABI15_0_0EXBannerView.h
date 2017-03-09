#import <ReactABI15_0_0/ABI15_0_0RCTView.h>
#import <ReactABI15_0_0/ABI15_0_0RCTComponent.h>

@interface ABI15_0_0EXBannerView : ABI15_0_0RCTView

@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
