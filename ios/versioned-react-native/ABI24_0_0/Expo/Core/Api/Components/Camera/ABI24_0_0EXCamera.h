#import <AVFoundation/AVFoundation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <UIKit/UIKit.h>

@class ABI24_0_0EXCameraManager;

@interface ABI24_0_0EXCamera : UIView

- (id)initWithManager:(ABI24_0_0EXCameraManager *)manager bridge:(ABI24_0_0RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;
- (void)onMountingError:(NSDictionary *)event;
- (void)onCodeRead:(NSDictionary *)event;
- (void)onFacesDetected:(NSDictionary *)event;

@end
