#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI17_0_0EXBarCodeScannerManager;

@interface ABI17_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI17_0_0EXBarCodeScannerManager *)manager bridge:(ABI17_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
