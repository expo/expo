#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

NSString *const RNCUserInterfaceStyleDidChangeNotification = @"RNCUserInterfaceStyleDidChangeNotification";

@interface RNCAppearance : RCTEventEmitter <RCTBridgeModule>


@end
