#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI21_0_0EXCameraManager;

@interface ABI21_0_0EXCamera : UIView

- (id)initWithManager:(ABI21_0_0EXCameraManager *)manager bridge:(ABI21_0_0RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;

@end
