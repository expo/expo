#import <ReactABI26_0_0/ABI26_0_0RCTView.h>
#import <ReactABI26_0_0/ABI26_0_0RCTComponent.h>

@interface ABI26_0_0EXBannerView : ABI26_0_0RCTView

@property (nonatomic, copy) ABI26_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI26_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
