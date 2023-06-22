#import "RNSConvert.h"

#ifdef RCT_NEW_ARCH_ENABLED
@implementation RNSConvert

+ (RNSScreenStackPresentation)RNSScreenStackPresentationFromCppEquivalent:
    (facebook::react::RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case facebook::react::RNSScreenStackPresentation::Push:
      return RNSScreenStackPresentationPush;
    case facebook::react::RNSScreenStackPresentation::Modal:
      return RNSScreenStackPresentationModal;
    case facebook::react::RNSScreenStackPresentation::FullScreenModal:
      return RNSScreenStackPresentationFullScreenModal;
    case facebook::react::RNSScreenStackPresentation::FormSheet:
      return RNSScreenStackPresentationFormSheet;
    case facebook::react::RNSScreenStackPresentation::ContainedModal:
      return RNSScreenStackPresentationContainedModal;
    case facebook::react::RNSScreenStackPresentation::TransparentModal:
      return RNSScreenStackPresentationTransparentModal;
    case facebook::react::RNSScreenStackPresentation::ContainedTransparentModal:
      return RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (RNSScreenStackAnimation)RNSScreenStackAnimationFromCppEquivalent:
    (facebook::react::RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these three are intentionally grouped
    case facebook::react::RNSScreenStackAnimation::Slide_from_right:
    case facebook::react::RNSScreenStackAnimation::Slide_from_left:
    case facebook::react::RNSScreenStackAnimation::Default:
      return RNSScreenStackAnimationDefault;
    case facebook::react::RNSScreenStackAnimation::Flip:
      return RNSScreenStackAnimationFlip;
    case facebook::react::RNSScreenStackAnimation::Simple_push:
      return RNSScreenStackAnimationSimplePush;
    case facebook::react::RNSScreenStackAnimation::None:
      return RNSScreenStackAnimationNone;
    case facebook::react::RNSScreenStackAnimation::Fade:
      return RNSScreenStackAnimationFade;
    case facebook::react::RNSScreenStackAnimation::Slide_from_bottom:
      return RNSScreenStackAnimationSlideFromBottom;
    case facebook::react::RNSScreenStackAnimation::Fade_from_bottom:
      return RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (RNSScreenStackHeaderSubviewType)RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (facebook::react::RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case facebook::react::RNSScreenStackHeaderSubviewType::Left:
      return RNSScreenStackHeaderSubviewTypeLeft;
    case facebook::react::RNSScreenStackHeaderSubviewType::Right:
      return RNSScreenStackHeaderSubviewTypeRight;
    case facebook::react::RNSScreenStackHeaderSubviewType::Title:
      return RNSScreenStackHeaderSubviewTypeTitle;
    case facebook::react::RNSScreenStackHeaderSubviewType::Center:
      return RNSScreenStackHeaderSubviewTypeCenter;
    case facebook::react::RNSScreenStackHeaderSubviewType::SearchBar:
      return RNSScreenStackHeaderSubviewTypeSearchBar;
    case facebook::react::RNSScreenStackHeaderSubviewType::Back:
      return RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (RNSScreenReplaceAnimation)RNSScreenReplaceAnimationFromCppEquivalent:
    (facebook::react::RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case facebook::react::RNSScreenReplaceAnimation::Pop:
      return RNSScreenReplaceAnimationPop;
    case facebook::react::RNSScreenReplaceAnimation::Push:
      return RNSScreenReplaceAnimationPush;
  }
}

+ (RNSScreenSwipeDirection)RNSScreenSwipeDirectionFromCppEquivalent:
    (facebook::react::RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case facebook::react::RNSScreenSwipeDirection::Horizontal:
      return RNSScreenSwipeDirectionHorizontal;
    case facebook::react::RNSScreenSwipeDirection::Vertical:
      return RNSScreenSwipeDirectionVertical;
  }
}

+ (RNSScreenDetentType)RNSScreenDetentTypeFromAllowedDetents:
    (facebook::react::RNSScreenSheetAllowedDetents)allowedDetents
{
  switch (allowedDetents) {
    case facebook::react::RNSScreenSheetAllowedDetents::All:
      return RNSScreenDetentTypeAll;
    case facebook::react::RNSScreenSheetAllowedDetents::Large:
      return RNSScreenDetentTypeLarge;
    case facebook::react::RNSScreenSheetAllowedDetents::Medium:
      return RNSScreenDetentTypeMedium;
  }
}

+ (RNSScreenDetentType)RNSScreenDetentTypeFromLargestUndimmedDetent:
    (facebook::react::RNSScreenSheetLargestUndimmedDetent)detent
{
  switch (detent) {
    case facebook::react::RNSScreenSheetLargestUndimmedDetent::All:
      return RNSScreenDetentTypeAll;
    case facebook::react::RNSScreenSheetLargestUndimmedDetent::Large:
      return RNSScreenDetentTypeLarge;
    case facebook::react::RNSScreenSheetLargestUndimmedDetent::Medium:
      return RNSScreenDetentTypeMedium;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const facebook::react::RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (facebook::react::RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case facebook::react::RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case facebook::react::RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case facebook::react::RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case facebook::react::RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

@end

#endif // RCT_NEW_ARCH_ENABLED
