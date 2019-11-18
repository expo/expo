#import <UIKit/UIKit.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>

@interface ABI36_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI36_0_0UMDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI36_0_0UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry;

@end
