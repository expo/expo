#import <Foundation/Foundation.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>

@interface ABI38_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI38_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI38_0_0ReactTag withConfig:(NSDictionary *)config;

@end
