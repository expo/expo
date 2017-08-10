#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI20_0_0EXBarCodeScannerManager;

@interface ABI20_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI20_0_0EXBarCodeScannerManager *)manager bridge:(ABI20_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
