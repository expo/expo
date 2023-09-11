/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTViewManager.h"

#import "ABI48_0_0RCTAssert.h"
#import "ABI48_0_0RCTBorderCurve.h"
#import "ABI48_0_0RCTBorderStyle.h"
#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTConvert+Transform.h"
#import "ABI48_0_0RCTConvert.h"
#import "ABI48_0_0RCTLog.h"
#import "ABI48_0_0RCTShadowView.h"
#import "ABI48_0_0RCTUIManager.h"
#import "ABI48_0_0RCTUIManagerUtils.h"
#import "ABI48_0_0RCTUtils.h"
#import "ABI48_0_0RCTView.h"
#import "ABI48_0_0UIView+React.h"

@implementation ABI48_0_0RCTConvert (UIAccessibilityTraits)

ABI48_0_0RCT_MULTI_ENUM_CONVERTER(
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
      @"grid" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI48_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI48_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI48_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge
{
  ABI48_0_0RCTErrorNewArchitectureValidation(
      ABI48_0_0RCTNotAllowedInBridgeless, self, @"ABI48_0_0RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (UIView *)view
{
  return [ABI48_0_0RCTView new];
}

- (ABI48_0_0RCTShadowView *)shadowView
{
  return [ABI48_0_0RCTShadowView new];
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
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI48_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI48_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI48_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI48_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLanguage, ABI48_0_0ReactAccessibilityElement.accessibilityLanguage, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI48_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI48_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI48_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI48_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI48_0_0ReactAccessibilityElement.onAccessibilityAction, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI48_0_0ReactAccessibilityElement.onAccessibilityTap, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI48_0_0ReactAccessibilityElement.onMagicTap, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI48_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI48_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI48_0_0YGOverflow, ABI48_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI48_0_0RCTConvert ABI48_0_0YGOverflow:json] != ABI48_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI48_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI48_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI48_0_0RCTView)
{
  view.layer.transform = json ? [ABI48_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI48_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI48_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI48_0_0RCTConvert NSString:json] : @"";
    view.ABI48_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI48_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI48_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI48_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI48_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI48_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI48_0_0RCTView)
{
  view.nativeID = json ? [ABI48_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI48_0_0RCTPointerEvents, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI48_0_0RCTConvert ABI48_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI48_0_0RCTConvert ABI48_0_0RCTPointerEvents:json]) {
    case ABI48_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI48_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI48_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI48_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI48_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(borderCurve, ABI48_0_0RCTBorderCurve, ABI48_0_0RCTView)
{
  if (@available(iOS 13.0, *)) {
    switch ([ABI48_0_0RCTConvert ABI48_0_0RCTBorderCurve:json]) {
      case ABI48_0_0RCTBorderCurveContinuous:
        view.layer.cornerCurve = kCACornerCurveContinuous;
        break;
      case ABI48_0_0RCTBorderCurveCircular:
        view.layer.cornerCurve = kCACornerCurveCircular;
        break;
    }
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, UIColor, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI48_0_0RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI48_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI48_0_0RCTBorderStyle, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI48_0_0RCTConvert ABI48_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI48_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI48_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, ABI48_0_0RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define ABI48_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI48_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI48_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI48_0_0RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI48_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI48_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI48_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI48_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI48_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI48_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI48_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI48_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI48_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI48_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI48_0_0ReactDisplay, ABI48_0_0YGDisplay)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI48_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI48_0_0YGValue)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI48_0_0YGValue)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI48_0_0YGValue)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI48_0_0YGValue)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI48_0_0YGValue)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI48_0_0YGValue)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI48_0_0YGFlexDirection)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI48_0_0YGWrap)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI48_0_0YGJustify)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI48_0_0YGAlign)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI48_0_0YGAlign)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI48_0_0YGAlign)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI48_0_0YGPositionType)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(rowGap, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(columnGap, float)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(gap, float)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI48_0_0YGOverflow)
ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI48_0_0YGDisplay)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI48_0_0RCTDirectEventBlock)

ABI48_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI48_0_0YGDirection)

// The events below define the properties that are not used by native directly, but required in the view config for new
// renderer to function.
// They can be deleted after Static View Configs are rolled out.

// PanResponder handlers
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponder, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponderCapture, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponder, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponderCapture, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderGrant, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderReject, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderStart, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderEnd, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderRelease, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderMove, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminate, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminationRequest, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onShouldBlockNativeResponder, BOOL, ABI48_0_0RCTView) {}

// Touch events
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchStart, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchMove, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchEnd, BOOL, ABI48_0_0RCTView) {}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchCancel, BOOL, ABI48_0_0RCTView) {}

// Experimental/WIP Pointer Events (not yet ready for use)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerCancel, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerDown, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerMove, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerUp, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerEnter, ABI48_0_0RCTCapturingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerLeave, ABI48_0_0RCTCapturingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOver, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOut, ABI48_0_0RCTBubblingEventBlock)

@end
