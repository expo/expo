#import <RNReanimated/REASnapshot.h>

@interface REASharedElement : NSObject

- (instancetype)initWithSourceView:(UIView *)sourceView
                sourceViewSnapshot:(REASnapshot *)sourceViewSnapshot
                        targetView:(UIView *)targetView
                targetViewSnapshot:(REASnapshot *)targetViewSnapshot;

@property UIView *sourceView;
@property REASnapshot *sourceViewSnapshot;
@property UIView *targetView;
@property REASnapshot *targetViewSnapshot;

@end
