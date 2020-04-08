#import <UIKit/UIKit.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>

@interface ABI37_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry;

@end
