#ifdef RN_FABRIC_ENABLED
#import <react/renderer/components/rnscreens/Props.h>
#import "ABI48_0_0RNSEnums.h"

@interface ABI48_0_0RNSConvert : NSObject

+ (ABI48_0_0RNSScreenStackPresentation)ABI48_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackPresentation)stackPresentation;

+ (ABI48_0_0RNSScreenStackAnimation)ABI48_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackAnimation)stackAnimation;

+ (ABI48_0_0RNSScreenStackHeaderSubviewType)ABI48_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenStackHeaderSubviewType)subviewType;

+ (ABI48_0_0RNSScreenReplaceAnimation)ABI48_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenReplaceAnimation)replaceAnimation;

+ (ABI48_0_0RNSScreenSwipeDirection)ABI48_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenSwipeDirection)swipeDirection;

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance;

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSSearchBarAutoCapitalize)autoCapitalize;

@end

#endif // RN_FABRIC_ENABLED
