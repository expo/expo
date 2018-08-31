#import <ReactABI30_0_0/ABI30_0_0RCTView.h>
#import <ReactABI30_0_0/ABI30_0_0RCTComponent.h>

@interface ABI30_0_0EXBannerView : ABI30_0_0RCTView

@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
