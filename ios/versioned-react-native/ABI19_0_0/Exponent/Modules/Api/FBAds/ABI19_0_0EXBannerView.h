#import <ReactABI19_0_0/ABI19_0_0RCTView.h>
#import <ReactABI19_0_0/ABI19_0_0RCTComponent.h>

@interface ABI19_0_0EXBannerView : ABI19_0_0RCTView

@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
