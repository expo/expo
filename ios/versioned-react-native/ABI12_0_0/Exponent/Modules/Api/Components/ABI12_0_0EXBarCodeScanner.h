#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI12_0_0EXBarCodeScannerManager;

@interface ABI12_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI12_0_0EXBarCodeScannerManager *)manager bridge:(ABI12_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
