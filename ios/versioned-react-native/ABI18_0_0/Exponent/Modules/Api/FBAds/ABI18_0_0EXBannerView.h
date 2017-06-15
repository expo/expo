#import <ReactABI18_0_0/ABI18_0_0RCTView.h>
#import <ReactABI18_0_0/ABI18_0_0RCTComponent.h>

@interface ABI18_0_0EXBannerView : ABI18_0_0RCTView

@property (nonatomic, copy) ABI18_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI18_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
