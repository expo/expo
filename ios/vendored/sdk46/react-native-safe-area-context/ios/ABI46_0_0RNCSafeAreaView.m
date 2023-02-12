#import "ABI46_0_0RNCSafeAreaView.h"

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>

#import "ABI46_0_0RNCSafeAreaProvider.h"
#import "ABI46_0_0RNCSafeAreaUtils.h"
#import "ABI46_0_0RNCSafeAreaViewEdges.h"
#import "ABI46_0_0RNCSafeAreaViewLocalData.h"
#import "ABI46_0_0RNCSafeAreaViewMode.h"

@implementation ABI46_0_0RNCSafeAreaView {
  __weak ABI46_0_0RCTBridge *_bridge;
  UIEdgeInsets _currentSafeAreaInsets;
  ABI46_0_0RNCSafeAreaViewMode _mode;
  ABI46_0_0RNCSafeAreaViewEdges _edges;
  __weak UIView *_Nullable _providerView;
}

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge
{
  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    // Defaults
    _mode = ABI46_0_0RNCSafeAreaViewModePadding;
    _edges = ABI46_0_0RNCSafeAreaViewEdgesAll;
  }

  return self;
}

ABI46_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)decoder)
ABI46_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; ABI46_0_0RNCSafeAreaInsets = %@; appliedRNCSafeAreaInsets = %@>",
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
     name:ABI46_0_0RNCSafeAreaDidChange
     object:previousProviderView];
    [NSNotificationCenter.defaultCenter
     addObserver:self
     selector:@selector(safeAreaProviderInsetsDidChange:)
     name:ABI46_0_0RNCSafeAreaDidChange
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

  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / ABI46_0_0RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;
  [self updateLocalData];
}

- (UIView *)findNearestProvider
{
  UIView *current = self.ABI46_0_0ReactSuperview;
  while (current != nil) {
    if ([current isKindOfClass:ABI46_0_0RNCSafeAreaProvider.class]) {
      return current;
    }
    current = current.ABI46_0_0ReactSuperview;
  }
  return self;
}

- (void)updateLocalData
{
  if (_providerView == nil) {
    return;
  }
  ABI46_0_0RNCSafeAreaViewLocalData *localData = [[ABI46_0_0RNCSafeAreaViewLocalData alloc] initWithInsets:_currentSafeAreaInsets
                                                                                    mode:_mode
                                                                                   edges:_edges];
  [_bridge.uiManager setLocalData:localData forView:self];
}

- (void)setMode:(ABI46_0_0RNCSafeAreaViewMode)mode
{
  _mode = mode;
  [self updateLocalData];
}

- (void)setEdges:(ABI46_0_0RNCSafeAreaViewEdges)edges
{
  _edges = edges;
  [self updateLocalData];
}

@end
