#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

@interface ABI46_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI46_0_0CardFormManager, ABI46_0_0RCTViewManager)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
ABI46_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI46_0_0ReactTag)
ABI46_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI46_0_0ReactTag)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
