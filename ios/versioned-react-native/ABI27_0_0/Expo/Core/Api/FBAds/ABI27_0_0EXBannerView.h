#import <ReactABI27_0_0/ABI27_0_0RCTView.h>
#import <ReactABI27_0_0/ABI27_0_0RCTComponent.h>

@interface ABI27_0_0EXBannerView : ABI27_0_0RCTView

@property (nonatomic, copy) ABI27_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI27_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
