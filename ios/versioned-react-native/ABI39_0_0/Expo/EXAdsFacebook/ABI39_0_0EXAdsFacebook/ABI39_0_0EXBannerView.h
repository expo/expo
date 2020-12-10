#import <UIKit/UIKit.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMDefines.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>

@interface ABI39_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI39_0_0UMDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI39_0_0UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry;

@end
