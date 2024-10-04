#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

@interface ABI43_0_0RCT_EXTERN_REMAP_MODULE(CardFieldManager, ABI43_0_0CardFieldManager, ABI43_0_0RCTViewManager)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onCardChange, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onFocusChange, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSDictionary)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI43_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI43_0_0ReactTag)
ABI43_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI43_0_0ReactTag)
ABI43_0_0RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) ABI43_0_0ReactTag)
@end
