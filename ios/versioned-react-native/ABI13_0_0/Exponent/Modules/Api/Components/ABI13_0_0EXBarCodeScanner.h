#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI13_0_0EXBarCodeScannerManager;

@interface ABI13_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI13_0_0EXBarCodeScannerManager *)manager bridge:(ABI13_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
