#import "DevMenuREATransition.h"
#import <React/RCTConvert.h>

@interface RCTConvert (DevMenuREATransition)

+ (DevMenuREATransitionType)DevMenuREATransitionType:(id)json;
+ (DevMenuREATransitionAnimationType)DevMenuREATransitionAnimationType:(id)json;
+ (DevMenuREATransitionInterpolationType)DevMenuREATransitionInterpolationType:(id)json;
+ (DevMenuREATransitionPropagationType)DevMenuREATransitionPropagationType:(id)json;

@end
