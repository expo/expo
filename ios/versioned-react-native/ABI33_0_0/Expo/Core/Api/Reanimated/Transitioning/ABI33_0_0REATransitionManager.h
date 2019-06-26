#import <Foundation/Foundation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>

@interface ABI33_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI33_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ReactABI33_0_0Tag withConfig:(NSDictionary *)config;

@end
