#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI23_0_0EXCameraManager;

@interface ABI23_0_0EXCamera : UIView

- (id)initWithManager:(ABI23_0_0EXCameraManager *)manager bridge:(ABI23_0_0RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;
- (void)onCodeRead:(NSDictionary *)event;

@end
