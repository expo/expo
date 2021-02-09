#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>

@interface ABI39_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI39_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI39_0_0ReactTag withConfig:(NSDictionary *)config;

@end
