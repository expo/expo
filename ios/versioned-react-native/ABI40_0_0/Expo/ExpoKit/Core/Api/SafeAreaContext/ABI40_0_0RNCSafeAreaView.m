#import "ABI40_0_0RNCSafeAreaView.h"

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>

#import "ABI40_0_0RNCSafeAreaViewLocalData.h"
#import "ABI40_0_0RNCSafeAreaViewMode.h"
#import "ABI40_0_0RNCSafeAreaViewEdges.h"
#import "ABI40_0_0RCTView+SafeAreaCompat.h"
#import "ABI40_0_0RNCSafeAreaProvider.h"

@implementation ABI40_0_0RNCSafeAreaView {
  __weak ABI40_0_0RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
  ABI40_0_0RNCSafeAreaViewMode _mode;
  ABI40_0_0RNCSafeAreaViewEdges _edges;
  __weak UIView * _Nullable _providerView;
}

- (instancetype)initWithBridge:(ABI40_0_0RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    // Defaults
    _mode = ABI40_0_0RNCSafeAreaViewModePadding;
    _edges = ABI40_0_0RNCSafeAreaViewEdgesAll;
  }

  return self;
}

ABI40_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)decoder)
ABI40_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; ABI40_0_0RNCSafeAreaInsets = %@; appliedRNCSafeAreaInsets = %@>",
          superDescription,
          NSStringFromUIEdgeInsets([_providerView safeAreaInsetsOrEmulate]),
          NSStringFromUIEdgeInsets(_currentSafeAreaInsets)];
}

- (void)safeAreaInsetsDidChange
{
  [super safeAreaInsetsDidChange];
  [self invalidateSafeAreaInsets];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  if (!self.nativeSafeAreaSupport) {
    [self invalidateSafeAreaInsets];
  }
}

- (void)didMoveToWindow
{
  _providerView = [self findNearestProvider];
  [self invalidateSafeAreaInsets];
}

- (void)invalidateSafeAreaInsets
{
  if (_providerView == nil) {
    return;
  }
  UIEdgeInsets safeAreaInsets = [_providerView safeAreaInsetsOrEmulate];

  if (ABI40_0_0UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / ABI40_0_0RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;
  [self updateLocalData];
}

- (UIView *)findNearestProvider
{
  UIView *current = self.ABI40_0_0ReactSuperview;
  while (current != nil) {
    if ([current isKindOfClass:ABI40_0_0RNCSafeAreaProvider.class] ) {
      return current;
    }
    current = current.ABI40_0_0ReactSuperview;
  }
  return self;
}

- (void)updateLocalData
{
  ABI40_0_0RNCSafeAreaViewLocalData *localData = [[ABI40_0_0RNCSafeAreaViewLocalData alloc] initWithInsets:_currentSafeAreaInsets
                                                                                    mode:_mode
                                                                                   edges:_edges];
  [_bridge.uiManager setLocalData:localData forView:self];
}

- (void)setMode:(ABI40_0_0RNCSafeAreaViewMode)mode
{
  _mode = mode;
  [self updateLocalData];
}

- (void)setEdges:(ABI40_0_0RNCSafeAreaViewEdges)edges
{
  _edges = edges;
  [self updateLocalData];
}

@end
