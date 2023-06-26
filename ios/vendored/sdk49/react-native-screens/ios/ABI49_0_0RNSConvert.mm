#import "ABI49_0_0RNSConvert.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
@implementation ABI49_0_0RNSConvert

+ (ABI49_0_0RNSScreenStackPresentation)ABI49_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::Push:
      return ABI49_0_0RNSScreenStackPresentationPush;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::Modal:
      return ABI49_0_0RNSScreenStackPresentationModal;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::FullScreenModal:
      return ABI49_0_0RNSScreenStackPresentationFullScreenModal;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::FormSheet:
      return ABI49_0_0RNSScreenStackPresentationFormSheet;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::ContainedModal:
      return ABI49_0_0RNSScreenStackPresentationContainedModal;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::TransparentModal:
      return ABI49_0_0RNSScreenStackPresentationTransparentModal;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation::ContainedTransparentModal:
      return ABI49_0_0RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (ABI49_0_0RNSScreenStackAnimation)ABI49_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these three are intentionally grouped
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Slide_from_right:
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Slide_from_left:
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Default:
      return ABI49_0_0RNSScreenStackAnimationDefault;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Flip:
      return ABI49_0_0RNSScreenStackAnimationFlip;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Simple_push:
      return ABI49_0_0RNSScreenStackAnimationSimplePush;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::None:
      return ABI49_0_0RNSScreenStackAnimationNone;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Fade:
      return ABI49_0_0RNSScreenStackAnimationFade;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Slide_from_bottom:
      return ABI49_0_0RNSScreenStackAnimationSlideFromBottom;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation::Fade_from_bottom:
      return ABI49_0_0RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (ABI49_0_0RNSScreenStackHeaderSubviewType)ABI49_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::Left:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeLeft;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::Right:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeRight;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::Title:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeTitle;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::Center:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeCenter;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::SearchBar:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeSearchBar;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType::Back:
      return ABI49_0_0RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (ABI49_0_0RNSScreenReplaceAnimation)ABI49_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenReplaceAnimation::Pop:
      return ABI49_0_0RNSScreenReplaceAnimationPop;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenReplaceAnimation::Push:
      return ABI49_0_0RNSScreenReplaceAnimationPush;
  }
}

+ (ABI49_0_0RNSScreenSwipeDirection)ABI49_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSwipeDirection::Horizontal:
      return ABI49_0_0RNSScreenSwipeDirectionHorizontal;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSwipeDirection::Vertical:
      return ABI49_0_0RNSScreenSwipeDirectionVertical;
  }
}

+ (ABI49_0_0RNSScreenDetentType)ABI49_0_0RNSScreenDetentTypeFromAllowedDetents:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetAllowedDetents)allowedDetents
{
  switch (allowedDetents) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetAllowedDetents::All:
      return ABI49_0_0RNSScreenDetentTypeAll;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetAllowedDetents::Large:
      return ABI49_0_0RNSScreenDetentTypeLarge;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetAllowedDetents::Medium:
      return ABI49_0_0RNSScreenDetentTypeMedium;
  }
}

+ (ABI49_0_0RNSScreenDetentType)ABI49_0_0RNSScreenDetentTypeFromLargestUndimmedDetent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetLargestUndimmedDetent)detent
{
  switch (detent) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetLargestUndimmedDetent::All:
      return ABI49_0_0RNSScreenDetentTypeAll;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetLargestUndimmedDetent::Large:
      return ABI49_0_0RNSScreenDetentTypeLarge;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetLargestUndimmedDetent::Medium:
      return ABI49_0_0RNSScreenDetentTypeMedium;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

@end

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
