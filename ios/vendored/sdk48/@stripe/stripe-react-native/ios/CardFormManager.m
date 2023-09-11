#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI48_0_0CardFormManager, ABI48_0_0RCTViewManager)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
ABI48_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI48_0_0ReactTag)
ABI48_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI48_0_0ReactTag)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
