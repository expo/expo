#import <Foundation/Foundation.h>

@interface DevMenuREATransitionAnimation : NSObject

@property (nonatomic) CAAnimation *animation;
@property (nonatomic) CALayer *layer;
@property (nonatomic) NSString *keyPath;

+ (DevMenuREATransitionAnimation *)transitionWithAnimation:(CAAnimation *)animation
                                              layer:(CALayer *)layer
                                         andKeyPath:(NSString *)keyPath;
- (void)play;
- (void)delayBy:(CFTimeInterval)delay;
- (CFTimeInterval)finishTime;
- (CFTimeInterval)duration;

@end
