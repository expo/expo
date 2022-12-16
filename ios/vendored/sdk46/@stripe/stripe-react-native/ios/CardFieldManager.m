#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

@interface ABI46_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI46_0_0CardFieldManager, ABI46_0_0RCTViewManager)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(countryCode, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(placeholders, NSDictionary)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI46_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI46_0_0ReactTag)
ABI46_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI46_0_0ReactTag)
ABI46_0_0RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) ABI46_0_0ReactTag)
@end
