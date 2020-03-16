/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTViewManager.h"

#import "ABI37_0_0RCTBorderStyle.h"
#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTConvert.h"
#import "ABI37_0_0RCTEventDispatcher.h"
#import "ABI37_0_0RCTLog.h"
#import "ABI37_0_0RCTShadowView.h"
#import "ABI37_0_0RCTUIManager.h"
#import "ABI37_0_0RCTUIManagerUtils.h"
#import "ABI37_0_0RCTUtils.h"
#import "ABI37_0_0RCTView.h"
#import "ABI37_0_0UIView+React.h"
#import "ABI37_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI37_0_0RCTTVView.h"
#endif

@implementation ABI37_0_0RCTConvert(UIAccessibilityTraits)

ABI37_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"imagebutton": @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"keyboardkey": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
  @"alert": @(UIAccessibilityTraitNone),
  @"checkbox": @(UIAccessibilityTraitNone),
  @"combobox": @(UIAccessibilityTraitNone),
  @"menu": @(UIAccessibilityTraitNone),
  @"menubar": @(UIAccessibilityTraitNone),
  @"menuitem": @(UIAccessibilityTraitNone),
  @"progressbar": @(UIAccessibilityTraitNone),
  @"radio": @(UIAccessibilityTraitNone),
  @"radiogroup": @(UIAccessibilityTraitNone),
  @"scrollbar": @(UIAccessibilityTraitNone),
  @"spinbutton": @(UIAccessibilityTraitNone),
  @"switch": @(SwitchAccessibilityTrait),
  @"tab": @(UIAccessibilityTraitNone),
  @"tablist": @(UIAccessibilityTraitNone),
  @"timer": @(UIAccessibilityTraitNone),
  @"toolbar": @(UIAccessibilityTraitNone),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI37_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI37_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI37_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI37_0_0RCTTVView new];
#else
  return [ABI37_0_0RCTView new];
#endif
}

- (ABI37_0_0RCTShadowView *)shadowView
{
  return [ABI37_0_0RCTShadowView new];
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
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI37_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI37_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI37_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI37_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI37_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI37_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ABI37_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI37_0_0ReactAccessibilityElement.onAccessibilityAction, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI37_0_0ReactAccessibilityElement.onAccessibilityTap, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI37_0_0ReactAccessibilityElement.onMagicTap, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI37_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI37_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI37_0_0YGOverflow, ABI37_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI37_0_0RCTConvert ABI37_0_0YGOverflow:json] != ABI37_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI37_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI37_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI37_0_0RCTView)
{
  view.layer.transform = json ? [ABI37_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI37_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI37_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI37_0_0RCTConvert NSString:json] : @"";
    view.ABI37_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, NSArray<NSString *>, ABI37_0_0RCTView)
{
  NSArray<NSString *> *states = json ? [ABI37_0_0RCTConvert NSStringArray:json] : nil;
  NSMutableArray *newStates = [NSMutableArray new];

  if (!states) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *state in states) {
    if ([state isEqualToString:@"selected"]) {
      view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([state isEqualToString:@"disabled"]) {
      view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      [newStates addObject:state];
    }
  }
  if (newStates.count > 0) {
    view.ABI37_0_0ReactAccessibilityElement.accessibilityStates = newStates;
  } else {
    view.ABI37_0_0ReactAccessibilityElement.accessibilityStates = nil;
  }
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI37_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI37_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI37_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI37_0_0ReactAccessibilityElement.accessibilityState = newState;
  } else {
    view.ABI37_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI37_0_0RCTView)
{
  view.nativeID = json ? [ABI37_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI37_0_0RCTPointerEvents, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI37_0_0RCTConvert ABI37_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI37_0_0RCTConvert ABI37_0_0RCTPointerEvents:json]) {
    case ABI37_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI37_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI37_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI37_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI37_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI37_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI37_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI37_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI37_0_0RCTBorderStyle, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI37_0_0RCTConvert ABI37_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI37_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI37_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI37_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI37_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI37_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI37_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI37_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI37_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI37_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI37_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI37_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI37_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI37_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI37_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI37_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI37_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI37_0_0ReactDisplay, ABI37_0_0YGDisplay)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI37_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI37_0_0YGValue)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI37_0_0YGValue)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI37_0_0YGValue)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI37_0_0YGValue)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI37_0_0YGValue)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI37_0_0YGValue)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI37_0_0YGFlexDirection)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI37_0_0YGWrap)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI37_0_0YGJustify)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI37_0_0YGAlign)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI37_0_0YGAlign)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI37_0_0YGAlign)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI37_0_0YGPositionType)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI37_0_0YGOverflow)
ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI37_0_0YGDisplay)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI37_0_0RCTDirectEventBlock)

ABI37_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI37_0_0YGDirection)

@end
