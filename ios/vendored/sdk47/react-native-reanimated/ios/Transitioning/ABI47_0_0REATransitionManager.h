#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>

@interface ABI47_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI47_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI47_0_0ReactTag withConfig:(NSDictionary *)config;

@end
