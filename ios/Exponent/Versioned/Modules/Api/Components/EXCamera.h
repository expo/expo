#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class EXCameraManager;

@interface EXCamera : UIView

- (id)initWithManager:(EXCameraManager *)manager bridge:(RCTBridge *)bridge;
- (void)onReady:(NSDictionary *)event;
- (void)onCodeRead:(NSDictionary *)event;

@end
