#import <React/RCTViewManager.h>

@protocol RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface RNSScreenContainerView : UIView <RNSScreenContainerDelegate>
@end
