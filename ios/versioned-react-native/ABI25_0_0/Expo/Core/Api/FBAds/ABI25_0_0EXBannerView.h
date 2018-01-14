#import <ReactABI25_0_0/ABI25_0_0RCTView.h>
#import <ReactABI25_0_0/ABI25_0_0RCTComponent.h>

@interface ABI25_0_0EXBannerView : ABI25_0_0RCTView

@property (nonatomic, copy) ABI25_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI25_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
