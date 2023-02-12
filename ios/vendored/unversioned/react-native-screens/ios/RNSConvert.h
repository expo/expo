#ifdef RN_FABRIC_ENABLED
#import <react/renderer/components/rnscreens/Props.h>
#import "RNSEnums.h"

@interface RNSConvert : NSObject

+ (RNSScreenStackPresentation)RNSScreenStackPresentationFromCppEquivalent:
    (facebook::react::RNSScreenStackPresentation)stackPresentation;

+ (RNSScreenStackAnimation)RNSScreenStackAnimationFromCppEquivalent:
    (facebook::react::RNSScreenStackAnimation)stackAnimation;

+ (RNSScreenStackHeaderSubviewType)RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (facebook::react::RNSScreenStackHeaderSubviewType)subviewType;

+ (RNSScreenReplaceAnimation)RNSScreenReplaceAnimationFromCppEquivalent:
    (facebook::react::RNSScreenReplaceAnimation)replaceAnimation;

+ (RNSScreenSwipeDirection)RNSScreenSwipeDirectionFromCppEquivalent:
    (facebook::react::RNSScreenSwipeDirection)swipeDirection;

+ (RNSScreenDetentType)RNSScreenDetentTypeFromAllowedDetents:
    (facebook::react::RNSScreenSheetAllowedDetents)allowedDetents;

+ (RNSScreenDetentType)RNSScreenDetentTypeFromLargestUndimmedDetent:
    (facebook::react::RNSScreenSheetLargestUndimmedDetent)detent;

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const facebook::react::RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance;

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (facebook::react::RNSSearchBarAutoCapitalize)autoCapitalize;

@end

#endif // RN_FABRIC_ENABLED
