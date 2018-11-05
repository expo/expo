/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTViewManager.h"

#import "ABI29_0_0RCTBorderStyle.h"
#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTEventDispatcher.h"
#import "ABI29_0_0RCTLog.h"
#import "ABI29_0_0RCTShadowView.h"
#import "ABI29_0_0RCTUIManager.h"
#import "ABI29_0_0RCTUIManagerUtils.h"
#import "ABI29_0_0RCTUtils.h"
#import "ABI29_0_0RCTView.h"
#import "UIView+ReactABI29_0_0.h"
#import "ABI29_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI29_0_0RCTTVView.h"
#endif

@implementation ABI29_0_0RCTConvert(UIAccessibilityTraits)

ABI29_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI29_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI29_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI29_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI29_0_0RCTTVView new];
#else
  return [ABI29_0_0RCTView new];
#endif
}

- (ABI29_0_0RCTShadowView *)shadowView
{
  return [ABI29_0_0RCTShadowView new];
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
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI29_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI29_0_0AccessibilityElement.accessibilityActions, NSString)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI29_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI29_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI29_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI29_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI29_0_0AccessibilityElement.onAccessibilityAction, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI29_0_0AccessibilityElement.onAccessibilityTap, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI29_0_0AccessibilityElement.onMagicTap, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI29_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI29_0_0YGOverflow, ABI29_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI29_0_0RCTConvert ABI29_0_0YGOverflow:json] != ABI29_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI29_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI29_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI29_0_0RCTView)
{
  view.layer.transform = json ? [ABI29_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI29_0_0RCTPointerEvents, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI29_0_0RCTConvert ABI29_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI29_0_0RCTConvert ABI29_0_0RCTPointerEvents:json]) {
    case ABI29_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI29_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI29_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI29_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI29_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI29_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI29_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI29_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI29_0_0RCTBorderStyle, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI29_0_0RCTConvert ABI29_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI29_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI29_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI29_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI29_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI29_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI29_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI29_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI29_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI29_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI29_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI29_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI29_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI29_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI29_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI29_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI29_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI29_0_0Display, ABI29_0_0YGDisplay)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI29_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI29_0_0YGValue)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI29_0_0YGValue)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI29_0_0YGValue)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI29_0_0YGValue)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI29_0_0YGValue)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI29_0_0YGValue)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI29_0_0YGFlexDirection)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI29_0_0YGWrap)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI29_0_0YGJustify)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI29_0_0YGAlign)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI29_0_0YGAlign)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI29_0_0YGAlign)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI29_0_0YGPositionType)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI29_0_0YGOverflow)
ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI29_0_0YGDisplay)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI29_0_0RCTDirectEventBlock)

ABI29_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI29_0_0YGDirection)

@end
