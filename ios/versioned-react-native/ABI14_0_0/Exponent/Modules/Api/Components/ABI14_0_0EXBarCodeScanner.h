#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI14_0_0EXBarCodeScannerManager;

@interface ABI14_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI14_0_0EXBarCodeScannerManager *)manager bridge:(ABI14_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
