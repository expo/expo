#import <ReactABI21_0_0/ABI21_0_0RCTView.h>
#import <ReactABI21_0_0/ABI21_0_0RCTComponent.h>

@interface ABI21_0_0EXBannerView : ABI21_0_0RCTView

@property (nonatomic, copy) ABI21_0_0RCTBubblingEventBlock onAdPress;
@property (nonatomic, copy) ABI21_0_0RCTBubblingEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

@end
