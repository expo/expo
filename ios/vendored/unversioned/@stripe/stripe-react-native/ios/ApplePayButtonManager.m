#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ApplePayButtonManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onPressAction, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(type, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(buttonStyle, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(borderRadius, NSNumber)
@end
