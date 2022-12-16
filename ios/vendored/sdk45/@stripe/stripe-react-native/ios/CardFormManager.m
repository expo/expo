#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>

@interface ABI45_0_0RCT_EXTERN_REMAP_MODULE(CardFormManager, ABI45_0_0CardFormManager, ABI45_0_0RCTViewManager)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onFormComplete, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
ABI45_0_0RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) ABI45_0_0ReactTag)
ABI45_0_0RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) ABI45_0_0ReactTag)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
