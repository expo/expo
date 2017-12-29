#import <ReactABI22_0_0/ABI22_0_0RCTView.h>
#import <ReactABI22_0_0/ABI22_0_0RCTComponent.h>

@interface ABI22_0_0EXBannerView : ABI22_0_0RCTView

@property (nonatomic, copy) ABI22_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI22_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
