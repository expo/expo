#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class ABI19_0_0EXBarCodeScannerManager;

@interface ABI19_0_0EXBarCodeScanner : UIView

- (id)initWithManager:(ABI19_0_0EXBarCodeScannerManager *)manager bridge:(ABI19_0_0RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end
