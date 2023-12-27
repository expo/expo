#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

@interface ABI42_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI42_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI42_0_0ReactTag withConfig:(NSDictionary *)config;

@end
