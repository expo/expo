#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI18_0_0EXBarCodeScannerManager;

@interface ABI18_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI18_0_0EXBarCodeScannerManager *)manager bridge:(ABI18_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
