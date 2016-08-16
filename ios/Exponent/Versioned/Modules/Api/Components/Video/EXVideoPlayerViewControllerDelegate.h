#import <Foundation/Foundation.h>
#import "AVKit/AVKit.h"

@protocol EXVideoPlayerViewControllerDelegate <NSObject>

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;

@end
