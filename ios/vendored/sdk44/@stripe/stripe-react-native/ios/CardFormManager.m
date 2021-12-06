#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

@interface ABI44_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI44_0_0CardFormManager, ABI44_0_0RCTViewManager)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
ABI44_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI44_0_0ReactTag)
ABI44_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI44_0_0ReactTag)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
