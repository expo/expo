#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(CardFieldManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(postalCodeEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(countryCode, NSString)
RCT_EXPORT_VIEW_PROPERTY(onCardChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFocusChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(cardStyle, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(placeholders, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(autofocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dangerouslyGetFullCardDetails, BOOL)
RCT_EXTERN_METHOD(focus:(nonnull NSNumber*) reactTag)
RCT_EXTERN_METHOD(blur:(nonnull NSNumber*) reactTag)
RCT_EXTERN_METHOD(clear:(nonnull NSNumber*) reactTag)
@end
