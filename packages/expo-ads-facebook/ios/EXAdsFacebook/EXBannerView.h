#import <UIKit/UIKit.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMModuleRegistry.h>

@interface EXBannerView : UIView

@property (nonatomic, copy) UMDirectEventBlock onAdPress;
@property (nonatomic, copy) UMDirectEventBlock onAdError;

@property (nonatomic, strong) NSNumber *size;
@property (nonatomic, strong) NSString *placementId;

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;

@end
