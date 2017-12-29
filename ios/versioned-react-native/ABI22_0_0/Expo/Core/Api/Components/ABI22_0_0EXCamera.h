#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI22_0_0EXCameraManager;

@interface ABI22_0_0EXCamera : UIView

- (id)initWithManager:(ABI22_0_0EXCameraManager *)manager bridge:(ABI22_0_0RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;

@end
