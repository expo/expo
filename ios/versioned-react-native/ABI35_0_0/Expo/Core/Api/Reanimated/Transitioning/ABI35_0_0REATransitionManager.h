#import <Foundation/Foundation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>

@interface ABI35_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI35_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ReactABI35_0_0Tag withConfig:(NSDictionary *)config;

@end
