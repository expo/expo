#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

@interface ABI47_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI47_0_0CardFormManager, ABI47_0_0RCTViewManager)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
ABI47_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI47_0_0ReactTag)
ABI47_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI47_0_0ReactTag)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
