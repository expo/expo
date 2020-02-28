#import <Foundation/Foundation.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>

@interface ABI37_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI37_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ABI37_0_0ReactTag withConfig:(NSDictionary *)config;

@end
