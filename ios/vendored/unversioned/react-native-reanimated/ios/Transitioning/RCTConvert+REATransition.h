#import <RNReanimated/REATransition.h>
#import <React/RCTConvert.h>

@interface RCTConvert (REATransition)

+ (REATransitionType)REATransitionType:(id)json;
+ (REATransitionAnimationType)REATransitionAnimationType:(id)json;
+ (REATransitionInterpolationType)REATransitionInterpolationType:(id)json;
+ (REATransitionPropagationType)REATransitionPropagationType:(id)json;

@end
