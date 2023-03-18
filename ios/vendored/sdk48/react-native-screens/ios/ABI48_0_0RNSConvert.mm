#import "ABI48_0_0RNSConvert.h"

#ifdef RN_FABRIC_ENABLED
@implementation ABI48_0_0RNSConvert

+ (ABI48_0_0RNSScreenStackPresentation)ABI48_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::Push:
      return ABI48_0_0RNSScreenStackPresentationPush;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::Modal:
      return ABI48_0_0RNSScreenStackPresentationModal;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::FullScreenModal:
      return ABI48_0_0RNSScreenStackPresentationFullScreenModal;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::FormSheet:
      return ABI48_0_0RNSScreenStackPresentationFormSheet;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::ContainedModal:
      return ABI48_0_0RNSScreenStackPresentationContainedModal;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::TransparentModal:
      return ABI48_0_0RNSScreenStackPresentationTransparentModal;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation::ContainedTransparentModal:
      return ABI48_0_0RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (ABI48_0_0RNSScreenStackAnimation)ABI48_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these three are intentionally grouped
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Slide_from_right:
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Slide_from_left:
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Default:
      return ABI48_0_0RNSScreenStackAnimationDefault;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Flip:
      return ABI48_0_0RNSScreenStackAnimationFlip;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Simple_push:
      return ABI48_0_0RNSScreenStackAnimationSimplePush;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::None:
      return ABI48_0_0RNSScreenStackAnimationNone;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Fade:
      return ABI48_0_0RNSScreenStackAnimationFade;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Slide_from_bottom:
      return ABI48_0_0RNSScreenStackAnimationSlideFromBottom;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation::Fade_from_bottom:
      return ABI48_0_0RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (ABI48_0_0RNSScreenStackHeaderSubviewType)ABI48_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::Left:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeLeft;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::Right:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeRight;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::Title:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeTitle;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::Center:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeCenter;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::SearchBar:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeSearchBar;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType::Back:
      return ABI48_0_0RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (ABI48_0_0RNSScreenReplaceAnimation)ABI48_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenReplaceAnimation::Pop:
      return ABI48_0_0RNSScreenReplaceAnimationPop;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenReplaceAnimation::Push:
      return ABI48_0_0RNSScreenReplaceAnimationPush;
  }
}

+ (ABI48_0_0RNSScreenSwipeDirection)ABI48_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenSwipeDirection::Horizontal:
      return ABI48_0_0RNSScreenSwipeDirectionHorizontal;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenSwipeDirection::Vertical:
      return ABI48_0_0RNSScreenSwipeDirectionVertical;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

@end

#endif // RN_FABRIC_ENABLED
