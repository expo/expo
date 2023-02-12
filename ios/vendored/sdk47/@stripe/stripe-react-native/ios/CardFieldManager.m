#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

@interface ABI47_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI47_0_0CardFieldManager, ABI47_0_0RCTViewManager)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(countryCode, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(placeholders, NSDictionary)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI47_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI47_0_0ReactTag)
ABI47_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI47_0_0ReactTag)
ABI47_0_0RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) ABI47_0_0ReactTag)
@end
