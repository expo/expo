#import <ABI49_0_0RNReanimated/ABI49_0_0REASharedElement.h>

@implementation ABI49_0_0REASharedElement
- (instancetype)initWithSourceView:(UIView *)sourceView
                sourceViewSnapshot:(ABI49_0_0REASnapshot *)sourceViewSnapshot
                        targetView:(UIView *)targetView
                targetViewSnapshot:(ABI49_0_0REASnapshot *)targetViewSnapshot
{
  self = [super init];
  _sourceView = sourceView;
  _sourceViewSnapshot = sourceViewSnapshot;
  _targetView = targetView;
  _targetViewSnapshot = targetViewSnapshot;
  return self;
}
@end
