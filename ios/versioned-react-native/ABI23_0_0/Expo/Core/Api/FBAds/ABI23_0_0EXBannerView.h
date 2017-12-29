#import <ReactABI23_0_0/ABI23_0_0RCTView.h>
#import <ReactABI23_0_0/ABI23_0_0RCTComponent.h>

@interface ABI23_0_0EXBannerView : ABI23_0_0RCTView

@property (nonatomic, copy) ABI23_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI23_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
