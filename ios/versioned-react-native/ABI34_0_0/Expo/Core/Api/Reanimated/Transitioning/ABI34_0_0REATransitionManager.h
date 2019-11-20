#import <Foundation/Foundation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>

@interface ABI34_0_0REATransitionManager : NSObject

- (instancetype)initWithUIManager:(ABI34_0_0RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)ReactABI34_0_0Tag withConfig:(NSDictionary *)config;

@end
