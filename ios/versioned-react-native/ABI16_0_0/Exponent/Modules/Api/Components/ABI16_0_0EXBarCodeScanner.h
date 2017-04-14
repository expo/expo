#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI16_0_0EXBarCodeScannerManager;

@interface ABI16_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI16_0_0EXBarCodeScannerManager *)manager bridge:(ABI16_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
