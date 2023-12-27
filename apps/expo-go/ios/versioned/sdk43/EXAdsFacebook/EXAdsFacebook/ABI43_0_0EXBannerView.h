#import <UIKit/UIKit.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

@interface ABI43_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry;

@end
