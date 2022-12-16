#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>

@interface ABI45_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI45_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI45_0_0ReactTag withConfig:(NSDictionary *)config;

@end
