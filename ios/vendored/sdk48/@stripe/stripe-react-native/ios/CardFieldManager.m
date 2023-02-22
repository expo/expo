#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI48_0_0CardFieldManager, ABI48_0_0RCTViewManager)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(countryCode, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(placeholders, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI48_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI48_0_0ReactTag)
ABI48_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI48_0_0ReactTag)
ABI48_0_0RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) ABI48_0_0ReactTag)
@end
