#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI15_0_0EXBarCodeScannerManager;

@interface ABI15_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI15_0_0EXBarCodeScannerManager *)manager bridge:(ABI15_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
