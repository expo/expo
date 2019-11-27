/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTViewManager.h"

#import "ABI36_0_0RCTBorderStyle.h"
#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTConvert.h"
#import "ABI36_0_0RCTEventDispatcher.h"
#import "ABI36_0_0RCTLog.h"
#import "ABI36_0_0RCTShadowView.h"
#import "ABI36_0_0RCTUIManager.h"
#import "ABI36_0_0RCTUIManagerUtils.h"
#import "ABI36_0_0RCTUtils.h"
#import "ABI36_0_0RCTView.h"
#import "ABI36_0_0UIView+React.h"
#import "ABI36_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI36_0_0RCTTVView.h"
#endif

@implementation ABI36_0_0RCTConvert(UIAccessibilityTraits)

ABI36_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI36_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI36_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI36_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI36_0_0RCTTVView new];
#else
  return [ABI36_0_0RCTView new];
#endif
}

- (ABI36_0_0RCTShadowView *)shadowView
{
  return [ABI36_0_0RCTShadowView new];
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
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI36_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI36_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI36_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI36_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI36_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI36_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ABI36_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI36_0_0ReactAccessibilityElement.onAccessibilityAction, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI36_0_0ReactAccessibilityElement.onAccessibilityTap, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI36_0_0ReactAccessibilityElement.onMagicTap, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI36_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI36_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI36_0_0YGOverflow, ABI36_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI36_0_0RCTConvert ABI36_0_0YGOverflow:json] != ABI36_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI36_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI36_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI36_0_0RCTView)
{
  view.layer.transform = json ? [ABI36_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI36_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI36_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI36_0_0RCTConvert NSString:json] : @"";
    view.ABI36_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, NSArray<NSString *>, ABI36_0_0RCTView)
{
  NSArray<NSString *> *states = json ? [ABI36_0_0RCTConvert NSStringArray:json] : nil;
  NSMutableArray *newStates = [NSMutableArray new];

  if (!states) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *state in states) {
    if ([state isEqualToString:@"selected"]) {
      view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([state isEqualToString:@"disabled"]) {
      view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      [newStates addObject:state];
    }
  }
  if (newStates.count > 0) {
    view.ABI36_0_0ReactAccessibilityElement.accessibilityStates = newStates;
  } else {
    view.ABI36_0_0ReactAccessibilityElement.accessibilityStates = nil;
  }
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI36_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI36_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI36_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI36_0_0ReactAccessibilityElement.accessibilityState = newState;
  } else {
    view.ABI36_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI36_0_0RCTView)
{
  view.nativeID = json ? [ABI36_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI36_0_0RCTPointerEvents, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI36_0_0RCTConvert ABI36_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI36_0_0RCTConvert ABI36_0_0RCTPointerEvents:json]) {
    case ABI36_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI36_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI36_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI36_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI36_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI36_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI36_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI36_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI36_0_0RCTBorderStyle, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI36_0_0RCTConvert ABI36_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI36_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI36_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI36_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI36_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI36_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI36_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI36_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI36_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI36_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI36_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI36_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI36_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI36_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI36_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI36_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI36_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI36_0_0ReactDisplay, ABI36_0_0YGDisplay)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI36_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI36_0_0YGValue)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI36_0_0YGValue)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI36_0_0YGValue)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI36_0_0YGValue)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI36_0_0YGValue)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI36_0_0YGValue)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI36_0_0YGFlexDirection)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI36_0_0YGWrap)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI36_0_0YGJustify)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI36_0_0YGAlign)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI36_0_0YGAlign)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI36_0_0YGAlign)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI36_0_0YGPositionType)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI36_0_0YGOverflow)
ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI36_0_0YGDisplay)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI36_0_0RCTDirectEventBlock)

ABI36_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI36_0_0YGDirection)

@end
