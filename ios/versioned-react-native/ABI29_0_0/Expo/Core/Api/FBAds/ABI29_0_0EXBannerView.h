#import <ReactABI29_0_0/ABI29_0_0RCTView.h>
#import <ReactABI29_0_0/ABI29_0_0RCTComponent.h>

@interface ABI29_0_0EXBannerView : ABI29_0_0RCTView

@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
