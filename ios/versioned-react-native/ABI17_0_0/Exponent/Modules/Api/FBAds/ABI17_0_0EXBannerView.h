#import <ReactABI17_0_0/ABI17_0_0RCTView.h>
#import <ReactABI17_0_0/ABI17_0_0RCTComponent.h>

@interface ABI17_0_0EXBannerView : ABI17_0_0RCTView

@property (nonatomic, copy) ABI17_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI17_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
