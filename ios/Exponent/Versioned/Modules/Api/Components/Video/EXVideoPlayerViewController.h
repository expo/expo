#import <AVKit/AVKit.h>
#import "EXVideo.h"
#import "EXVideoPlayerViewControllerDelegate.h"

@interface EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
