#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI21_0_0EXBarCodeScannerManager;

@interface ABI21_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI21_0_0EXBarCodeScannerManager *)manager bridge:(ABI21_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
