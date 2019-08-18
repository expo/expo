
#import <UIKit/UIKit.h>

@class EXLoadingProgress;

@interface EXAppLoadingProgressView : UIView

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress;

@end
