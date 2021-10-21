#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUIVisualEffectView : UIVisualEffectView

/**
 * Value from range 0.0 to 30.0.
 */
@property (nonatomic) NSNumber* blurRadius;
@property (nonatomic) UIBlurEffectStyle blurEffectStyle;

- (instancetype)initWithBlurEffectStyle:(UIBlurEffectStyle)blurEffectStyle
                          andBlurRadius:(NSNumber *)blurRadius;

@end

NS_ASSUME_NONNULL_END
