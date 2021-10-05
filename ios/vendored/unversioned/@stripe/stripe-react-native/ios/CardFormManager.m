#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(CardFormManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onFormComplete, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isUserInteractionEnabledValue, BOOL)
RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) reactTag)
RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) reactTag)
RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
@end
