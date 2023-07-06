#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI49_0_0CardFormManager, ABI49_0_0RCTViewManager)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
ABI49_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI49_0_0ReactTag)
ABI49_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI49_0_0ReactTag)
@end
