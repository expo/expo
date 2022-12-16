#import "RNCSafeAreaView.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

#import "RNCSafeAreaProvider.h"
#import "RNCSafeAreaUtils.h"
#import "RNCSafeAreaViewEdges.h"
#import "RNCSafeAreaViewLocalData.h"
#import "RNCSafeAreaViewMode.h"

@implementation RNCSafeAreaView {
  __weak RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
  RNCSafeAreaViewMode _mode;
  RNCSafeAreaViewEdges _edges;
  __weak UIView *_Nullable _providerView;
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
                                    NSStringFromUIEdgeInsets(_providerView.safeAreaInsets),
                                    NSStringFromUIEdgeInsets(_currentSafeAreaInsets)];
}

- (void)didMoveToWindow
{
  UIView *previousProviderView = _providerView;
  _providerView = [self findNearestProvider];

  [self invalidateSafeAreaInsets];

  if (previousProviderView != _providerView) {
    [NSNotificationCenter.defaultCenter
     removeObserver:self
     name:RNCSafeAreaDidChange
     object:previousProviderView];
    [NSNotificationCenter.defaultCenter
     addObserver:self
     selector:@selector(safeAreaProviderInsetsDidChange:)
     name:RNCSafeAreaDidChange
     object:_providerView];
  }
}

- (void)safeAreaProviderInsetsDidChange:(NSNotification *)notification
{
  [self invalidateSafeAreaInsets];
}

- (void)invalidateSafeAreaInsets
{
  if (_providerView == nil) {
    return;
  }
  UIEdgeInsets safeAreaInsets = _providerView.safeAreaInsets;

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
    if ([current isKindOfClass:RNCSafeAreaProvider.class]) {
      return current;
    }
    current = current.reactSuperview;
  }
  return self;
}

- (void)updateLocalData
{
  if (_providerView == nil) {
    return;
  }
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
