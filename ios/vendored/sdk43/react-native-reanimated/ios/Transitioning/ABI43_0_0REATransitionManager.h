#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>

@interface ABI43_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI43_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI43_0_0ReactTag withConfig:(NSDictionary *)config;

@end
