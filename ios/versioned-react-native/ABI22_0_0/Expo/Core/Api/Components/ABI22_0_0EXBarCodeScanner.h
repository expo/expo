#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI22_0_0EXBarCodeScannerManager;

@interface ABI22_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI22_0_0EXBarCodeScannerManager *)manager bridge:(ABI22_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
