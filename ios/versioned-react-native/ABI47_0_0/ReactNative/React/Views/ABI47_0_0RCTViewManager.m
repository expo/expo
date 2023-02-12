/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTViewManager.h"

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTBorderStyle.h"
#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTConvert+Transform.h"
#import "ABI47_0_0RCTConvert.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTShadowView.h"
#import "ABI47_0_0RCTUIManager.h"
#import "ABI47_0_0RCTUIManagerUtils.h"
#import "ABI47_0_0RCTUtils.h"
#import "ABI47_0_0RCTView.h"
#import "ABI47_0_0UIView+React.h"

@implementation ABI47_0_0RCTConvert (UIAccessibilityTraits)

ABI47_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"togglebutton" : @(UIAccessibilityTraitButton),
      @"link" : @(UIAccessibilityTraitLink),
      @"header" : @(UIAccessibilityTraitHeader),
      @"search" : @(UIAccessibilityTraitSearchField),
      @"image" : @(UIAccessibilityTraitImage),
      @"imagebutton" : @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
      @"selected" : @(UIAccessibilityTraitSelected),
      @"plays" : @(UIAccessibilityTraitPlaysSound),
      @"key" : @(UIAccessibilityTraitKeyboardKey),
      @"keyboardkey" : @(UIAccessibilityTraitKeyboardKey),
      @"text" : @(UIAccessibilityTraitStaticText),
      @"summary" : @(UIAccessibilityTraitSummaryElement),
      @"disabled" : @(UIAccessibilityTraitNotEnabled),
      @"frequentUpdates" : @(UIAccessibilityTraitUpdatesFrequently),
      @"startsMedia" : @(UIAccessibilityTraitStartsMediaSession),
      @"adjustable" : @(UIAccessibilityTraitAdjustable),
      @"allowsDirectInteraction" : @(UIAccessibilityTraitAllowsDirectInteraction),
      @"pageTurn" : @(UIAccessibilityTraitCausesPageTurn),
      @"alert" : @(UIAccessibilityTraitNone),
      @"checkbox" : @(UIAccessibilityTraitNone),
      @"combobox" : @(UIAccessibilityTraitNone),
      @"menu" : @(UIAccessibilityTraitNone),
      @"menubar" : @(UIAccessibilityTraitNone),
      @"menuitem" : @(UIAccessibilityTraitNone),
      @"progressbar" : @(UIAccessibilityTraitUpdatesFrequently),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tabbar" : @(UIAccessibilityTraitTabBar),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
      @"list" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI47_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI47_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI47_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  ABI47_0_0RCTErrorNewArchitectureValidation(
      ABI47_0_0RCTNotAllowedInBridgeless, self, @"ABI47_0_0RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (UIView *)view
{
  return [ABI47_0_0RCTView new];
}

- (ABI47_0_0RCTShadowView *)shadowView
{
  return [ABI47_0_0RCTShadowView new];
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

// Accessibility related properties
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI47_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI47_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI47_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI47_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLanguage, ABI47_0_0ReactAccessibilityElement.accessibilityLanguage, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI47_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI47_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI47_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI47_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI47_0_0ReactAccessibilityElement.onAccessibilityAction, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI47_0_0ReactAccessibilityElement.onAccessibilityTap, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI47_0_0ReactAccessibilityElement.onMagicTap, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI47_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI47_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI47_0_0YGOverflow, ABI47_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI47_0_0RCTConvert ABI47_0_0YGOverflow:json] != ABI47_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI47_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI47_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI47_0_0RCTView)
{
  view.layer.transform = json ? [ABI47_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI47_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI47_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI47_0_0RCTConvert NSString:json] : @"";
    view.ABI47_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI47_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI47_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI47_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI47_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI47_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI47_0_0RCTView)
{
  view.nativeID = json ? [ABI47_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI47_0_0RCTPointerEvents, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI47_0_0RCTConvert ABI47_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI47_0_0RCTConvert ABI47_0_0RCTPointerEvents:json]) {
    case ABI47_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI47_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI47_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI47_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI47_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, UIColor, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI47_0_0RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI47_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI47_0_0RCTBorderStyle, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI47_0_0RCTConvert ABI47_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI47_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI47_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, ABI47_0_0RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define ABI47_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI47_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI47_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI47_0_0RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI47_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI47_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI47_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI47_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI47_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI47_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI47_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI47_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI47_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI47_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI47_0_0ReactDisplay, ABI47_0_0YGDisplay)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI47_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI47_0_0YGValue)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI47_0_0YGValue)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI47_0_0YGValue)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI47_0_0YGValue)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI47_0_0YGValue)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI47_0_0YGValue)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI47_0_0YGFlexDirection)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI47_0_0YGWrap)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI47_0_0YGJustify)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI47_0_0YGAlign)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI47_0_0YGAlign)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI47_0_0YGAlign)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI47_0_0YGPositionType)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI47_0_0YGOverflow)
ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI47_0_0YGDisplay)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI47_0_0RCTDirectEventBlock)

ABI47_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI47_0_0YGDirection)

// The events below define the properties that are not used by native directly, but required in the view config for new
// renderer to function.
// They can be deleted after Static View Configs are rolled out.

// PanResponder handlers
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponder, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponderCapture, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponder, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponderCapture, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderGrant, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderReject, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderStart, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderEnd, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderRelease, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderMove, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminate, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminationRequest, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onShouldBlockNativeResponder, BOOL, ABI47_0_0RCTView) {}

// Touch events
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchStart, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchMove, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchEnd, BOOL, ABI47_0_0RCTView) {}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchCancel, BOOL, ABI47_0_0RCTView) {}

// Experimental/WIP Pointer Events (not yet ready for use)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerCancel, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerDown, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerMove, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerUp, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerEnter, ABI47_0_0RCTCapturingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerLeave, ABI47_0_0RCTCapturingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOver, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOut, ABI47_0_0RCTBubblingEventBlock)

@end
