#import <ABI49_0_0RNReanimated/ABI49_0_0REASnapshot.h>

@interface ABI49_0_0REASharedElement : NSObject

- (instancetype)initWithSourceView:(UIView *)sourceView
                sourceViewSnapshot:(ABI49_0_0REASnapshot *)sourceViewSnapshot
                        targetView:(UIView *)targetView
                targetViewSnapshot:(ABI49_0_0REASnapshot *)targetViewSnapshot;

@property UIView *sourceView;
@property ABI49_0_0REASnapshot *sourceViewSnapshot;
@property UIView *targetView;
@property ABI49_0_0REASnapshot *targetViewSnapshot;

@end
