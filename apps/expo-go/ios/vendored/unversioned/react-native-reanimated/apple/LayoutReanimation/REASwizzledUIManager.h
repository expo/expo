#import <RNReanimated/REAAnimationsManager.h>

@interface REASwizzledUIManager : NSObject
- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
             withAnimationManager:(REAAnimationsManager *)animationsManager;
@end
