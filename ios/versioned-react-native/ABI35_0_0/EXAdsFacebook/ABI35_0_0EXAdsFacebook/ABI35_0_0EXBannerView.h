#import <UIKit/UIKit.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMDefines.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistry.h>

@interface ABI35_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI35_0_0UMDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI35_0_0UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry;

@end
