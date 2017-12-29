#import <ReactABI24_0_0/ABI24_0_0RCTView.h>
#import <ReactABI24_0_0/ABI24_0_0RCTComponent.h>

@interface ABI24_0_0EXBannerView : ABI24_0_0RCTView

@property (nonatomic, copy) ABI24_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI24_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
