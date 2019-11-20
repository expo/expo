#import <Foundation/Foundation.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>

@interface ABI36_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI36_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI36_0_0ReactTag withConfig:(NSDictionary *)config;

@end
