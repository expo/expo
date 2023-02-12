#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

@interface ABI48_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI48_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI48_0_0ReactTag withConfig:(NSDictionary *)config;

@end
