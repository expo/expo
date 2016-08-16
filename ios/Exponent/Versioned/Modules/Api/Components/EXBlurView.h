#import <UIKit/UIKit.h>
#import "RCTView.h"

@interface EXBlurView : RCTView

@property (nonatomic, copy) NSString *tintEffect;
@property (nonatomic, strong) UIVisualEffectView *visualEffectView;

@end