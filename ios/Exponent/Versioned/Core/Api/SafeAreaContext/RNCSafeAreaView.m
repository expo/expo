#import "RNCSafeAreaView.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

#import "RNCSafeAreaViewLocalData.h"
#import "RNCSafeAreaViewMode.h"
#import "RNCSafeAreaViewEdges.h"
#import "RCTView+SafeAreaCompat.h"
#import "RNCSafeAreaProvider.h"

@implementation RNCSafeAreaView {
  __weak RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
  RNCSafeAreaViewMode _mode;
  RNCSafeAreaViewEdges _edges;
  __weak UIView * _Nullable _providerView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    // Defaults
    _mode = RNCSafeAreaViewModePadding;
    _edges = RNCSafeAreaViewEdgesAll;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)decoder)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; RNCSafeAreaInsets = %@; appliedRNCSafeAreaInsets = %@>",
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

  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;
  [self updateLocalData];
}

- (UIView *)findNearestProvider
{
  UIView *current = self.reactSuperview;
  while (current != nil) {
    if ([current isKindOfClass:RNCSafeAreaProvider.class] ) {
      return current;
    }
    current = current.reactSuperview;
  }
  return self;
}

- (void)updateLocalData
{
  RNCSafeAreaViewLocalData *localData = [[RNCSafeAreaViewLocalData alloc] initWithInsets:_currentSafeAreaInsets
                                                                                    mode:_mode
                                                                                   edges:_edges];
  [_bridge.uiManager setLocalData:localData forView:self];
}

- (void)setMode:(RNCSafeAreaViewMode)mode
{
  _mode = mode;
  [self updateLocalData];
}

- (void)setEdges:(RNCSafeAreaViewEdges)edges
{
  _edges = edges;
  [self updateLocalData];
}

@end
