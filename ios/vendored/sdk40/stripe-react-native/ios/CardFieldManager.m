#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

@interface ABI40_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI40_0_0CardFieldManager, ABI40_0_0RCTViewManager)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI40_0_0RCTDirectEventBlock)
@end
