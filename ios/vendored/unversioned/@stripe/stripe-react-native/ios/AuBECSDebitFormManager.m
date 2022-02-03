#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(AuBECSDebitFormManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(companyName, NSString)
RCT_EXPORT_VIEW_PROPERTY(formStyle, NSDictionary)
@end
