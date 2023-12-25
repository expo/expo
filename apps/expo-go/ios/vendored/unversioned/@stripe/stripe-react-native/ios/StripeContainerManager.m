#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import "React/RCTUIManager.h"

@interface RCT_EXTERN_MODULE(StripeContainerManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(keyboardShouldPersistTaps, BOOL)
@end
