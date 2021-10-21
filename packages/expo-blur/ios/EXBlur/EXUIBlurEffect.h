#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUIBlurEffect : UIBlurEffect

+ (instancetype)effectWithStyle:(UIBlurEffectStyle)style andBlurRadius:(NSNumber *)blurRadius;

@end

NS_ASSUME_NONNULL_END
