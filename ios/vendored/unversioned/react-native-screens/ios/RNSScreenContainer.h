#import <React/RCTViewManager.h>

@protocol RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol RNScreensViewControllerDelegate

@end

@interface RNScreensViewController : UIViewController <RNScreensViewControllerDelegate>

@end

@interface RNSScreenContainerManager : RCTViewManager

@end

@interface RNSScreenContainerView : UIView <RNSScreenContainerDelegate, RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *reactSubviews;

- (void)maybeDismissVC;

@end
