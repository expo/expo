#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

@interface EXBannerView : UIView

@property (nonatomic, copy) EXDirectEventBlock onAdPress;
@property (nonatomic, copy) EXDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;

@end
