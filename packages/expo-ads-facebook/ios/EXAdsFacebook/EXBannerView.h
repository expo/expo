#import <UIKit/UIKit.h>
#import <EXCore/EXDefines.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXBannerView : UIView

@property (nonatomic, copy) EXDirectEventBlock onAdPress;
@property (nonatomic, copy) EXDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;

@end
