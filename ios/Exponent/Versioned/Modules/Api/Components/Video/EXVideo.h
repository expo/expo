#import "RCTView.h"
#import "RCTBridge.h"
#import <AVFoundation/AVFoundation.h>
#import "AVKit/AVKit.h"
#import "UIView+FindUIViewController.h"
#import "EXVideoPlayerViewController.h"
#import "EXVideoPlayerViewControllerDelegate.h"

@class RCTEventDispatcher;

@interface EXVideo : UIView <EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
