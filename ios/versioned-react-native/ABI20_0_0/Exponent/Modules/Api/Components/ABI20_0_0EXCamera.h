#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI20_0_0EXCameraManager;

@interface ABI20_0_0EXCamera : UIView

- (id)initWithManager:(ABI20_0_0EXCameraManager *)manager bridge:(ABI20_0_0RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;

@end
