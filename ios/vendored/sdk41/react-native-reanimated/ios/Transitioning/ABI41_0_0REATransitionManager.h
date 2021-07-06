#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

@interface ABI41_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI41_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI41_0_0ReactTag withConfig:(NSDictionary *)config;

@end
