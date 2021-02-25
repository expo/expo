#import <Foundation/Foundation.h>
#import <React/RCTUIManager.h>

@interface REATransitionManager : NSObject

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager;
- (void)animateNextTransitionInRoot:(nonnull NSNumber *)reactTag withConfig:(NSDictionary *)config;

@end
