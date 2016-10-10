#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@class EXBarCodeScannerManager;

@interface EXBarCodeScanner : UIView

- (id)initWithManager:(EXBarCodeScannerManager *)manager bridge:(RCTBridge *)bridge;
- (void)onRead:(NSDictionary *)event;

@end