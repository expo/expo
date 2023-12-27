#import <UIKit/UIKit.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

@interface ABI44_0_0EXBannerView : UIView

@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onAdPress;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry;

@end
