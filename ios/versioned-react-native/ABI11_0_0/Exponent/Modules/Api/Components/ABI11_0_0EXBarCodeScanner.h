#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI11_0_0EXBarCodeScannerManager;

@interface ABI11_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI11_0_0EXBarCodeScannerManager *)manager bridge:(ABI11_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
