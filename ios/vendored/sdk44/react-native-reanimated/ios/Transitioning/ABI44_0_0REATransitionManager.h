#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>

@interface ABI44_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI44_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI44_0_0ReactTag withConfig:(NSDictionary *)config;

@end
