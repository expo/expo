#import "RNCSafeAreaShadowView.h"

#import <React/RCTAssert.h>
#include <math.h>

#import "RNCSafeAreaViewLocalData.h"
#import "RNCSafeAreaViewEdges.h"

@implementation RNCSafeAreaShadowView {
  UIEdgeInsets _insets;
  RNCSafeAreaViewEdges _edges;
  CGFloat _padding;
  CGFloat _paddingHorizontal;
  CGFloat _paddingVertical;
  CGFloat _paddingTop;
  CGFloat _paddingRight;
  CGFloat _paddingBottom;
  CGFloat _paddingLeft;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _padding = NAN;
    _paddingHorizontal = NAN;
    _paddingVertical = NAN;
    _paddingTop = NAN;
    _paddingRight = NAN;
    _paddingBottom = NAN;
    _paddingLeft = NAN;
  }
  return self;
}

- (void)updateInsets
{
  CGFloat paddingTop = 0;
  CGFloat paddingRight = 0;
  CGFloat paddingBottom = 0;
  CGFloat paddingLeft = 0;
  
  if (!isnan(_padding)) {
    paddingTop = _padding;
    paddingRight = _padding;
    paddingBottom = _padding;
    paddingLeft = _padding;
  }
  
  if (!isnan(_paddingHorizontal)) {
    paddingRight = _paddingHorizontal;
    paddingLeft = _paddingHorizontal;
  }
  
  if (!isnan(_paddingVertical)) {
    paddingTop = _paddingVertical;
    paddingBottom = _paddingVertical;
  }
  
  if (!isnan(_paddingTop)) {
    paddingTop = _paddingTop;
  }
  
  if (!isnan(_paddingRight)) {
    paddingRight = _paddingRight;
  }
  
  if (!isnan(_paddingBottom)) {
    paddingBottom = _paddingBottom;
  }
  
  if (!isnan(_paddingLeft)) {
    paddingLeft = _paddingLeft;
  }
  
  CGFloat insetTop = (_edges & RNCSafeAreaViewEdgesTop) ? _insets.top : 0;
  CGFloat insetRight = (_edges & RNCSafeAreaViewEdgesRight) ? _insets.right : 0;
  CGFloat insetBottom = (_edges & RNCSafeAreaViewEdgesBottom) ? _insets.bottom : 0;
  CGFloat insetLeft = (_edges & RNCSafeAreaViewEdgesLeft) ? _insets.left : 0;
  
  super.paddingTop = (YGValue){insetTop + paddingTop, YGUnitPoint};
  super.paddingRight = (YGValue){insetRight + paddingRight, YGUnitPoint};
  super.paddingBottom = (YGValue){insetBottom + paddingBottom, YGUnitPoint};
  super.paddingLeft = (YGValue){insetLeft + paddingLeft, YGUnitPoint};

  [self didSetProps:@[@"paddingTop", @"paddingRight", @"paddingBottom", @"paddingLeft"]];
}

- (void)setLocalData:(RNCSafeAreaViewLocalData *)localData
{
  RCTAssert(
    [localData isKindOfClass:[RNCSafeAreaViewLocalData class]],
    @"Local data object for `RCTRNCSafeAreaShadowView` must be `RCTRNCSafeAreaViewLocalData` instance."
  );
  
  _insets = localData.insets;
  _edges = localData.edges;
  [self updateInsets];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
#define SHADOW_VIEW_PADDING_PROPERTY(prop)                        \
- (void)setPadding##prop:(YGValue)value                           \
{                                                                 \
  _padding##prop = value.unit == YGUnitPoint ? value.value : NAN; \
  [self updateInsets];                                            \
}

SHADOW_VIEW_PADDING_PROPERTY();
SHADOW_VIEW_PADDING_PROPERTY(Top);
SHADOW_VIEW_PADDING_PROPERTY(Right);
SHADOW_VIEW_PADDING_PROPERTY(Bottom);
SHADOW_VIEW_PADDING_PROPERTY(Left);
SHADOW_VIEW_PADDING_PROPERTY(Horizontal);
SHADOW_VIEW_PADDING_PROPERTY(Vertical);

@end
