#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI49_0_0CardFieldManager, ABI49_0_0RCTViewManager)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(countryCode, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(placeholders, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI49_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI49_0_0ReactTag)
ABI49_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI49_0_0ReactTag)
ABI49_0_0RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) ABI49_0_0ReactTag)
@end
