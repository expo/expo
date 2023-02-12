#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>

@interface ABI46_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI46_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI46_0_0ReactTag withConfig:(NSDictionary *)config;

@end
