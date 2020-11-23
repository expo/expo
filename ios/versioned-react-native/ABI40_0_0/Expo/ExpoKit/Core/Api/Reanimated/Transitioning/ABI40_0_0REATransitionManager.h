#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>

@interface ABI40_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI40_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI40_0_0ReactTag withConfig:(NSDictionary *)config;

@end
