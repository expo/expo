#import <UIKit/UIKit.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMDefines.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>

@interface ABI34_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;

@end
