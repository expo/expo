/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTViewManager.h"

#import "ABI27_0_0RCTBorderStyle.h"
#import "ABI27_0_0RCTBridge.h"
#import "ABI27_0_0RCTConvert.h"
#import "ABI27_0_0RCTEventDispatcher.h"
#import "ABI27_0_0RCTLog.h"
#import "ABI27_0_0RCTShadowView.h"
#import "ABI27_0_0RCTUIManager.h"
#import "ABI27_0_0RCTUIManagerUtils.h"
#import "ABI27_0_0RCTUtils.h"
#import "ABI27_0_0RCTView.h"
#import "UIView+ReactABI27_0_0.h"
#import "ABI27_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI27_0_0RCTTVView.h"
#endif

@implementation ABI27_0_0RCTConvert(UIAccessibilityTraits)

ABI27_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI27_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI27_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI27_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI27_0_0RCTTVView new];
#else
  return [ABI27_0_0RCTView new];
#endif
}

- (ABI27_0_0RCTShadowView *)shadowView
{
  return [ABI27_0_0RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI27_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI27_0_0AccessibilityElement.accessibilityActions, NSString)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI27_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI27_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI27_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI27_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI27_0_0AccessibilityElement.onAccessibilityAction, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI27_0_0AccessibilityElement.onAccessibilityTap, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI27_0_0AccessibilityElement.onMagicTap, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI27_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI27_0_0YGOverflow, ABI27_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI27_0_0RCTConvert ABI27_0_0YGOverflow:json] != ABI27_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI27_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI27_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI27_0_0RCTView)
{
  view.layer.transform = json ? [ABI27_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI27_0_0RCTPointerEvents, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI27_0_0RCTConvert ABI27_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI27_0_0RCTConvert ABI27_0_0RCTPointerEvents:json]) {
    case ABI27_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI27_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI27_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI27_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI27_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI27_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI27_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI27_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI27_0_0RCTBorderStyle, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI27_0_0RCTConvert ABI27_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI27_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI27_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI27_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI27_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI27_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI27_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI27_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI27_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI27_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI27_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI27_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI27_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI27_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI27_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI27_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI27_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI27_0_0Display, ABI27_0_0YGDisplay)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI27_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI27_0_0YGValue)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI27_0_0YGValue)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI27_0_0YGValue)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI27_0_0YGValue)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI27_0_0YGValue)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI27_0_0YGValue)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI27_0_0YGFlexDirection)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI27_0_0YGWrap)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI27_0_0YGJustify)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI27_0_0YGAlign)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI27_0_0YGAlign)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI27_0_0YGAlign)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI27_0_0YGPositionType)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI27_0_0YGOverflow)
ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI27_0_0YGDisplay)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI27_0_0RCTDirectEventBlock)

ABI27_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI27_0_0YGDirection)

@end
