
#import <UIKit/UIKit.h>

@interface EXAppLoadingView : UIView

- (instancetype)initUsingSplash:(BOOL)usesSplash;

@property (nonatomic, strong) NSDictionary *manifest;
@property (nonatomic, assign) CGFloat progress;

@end
