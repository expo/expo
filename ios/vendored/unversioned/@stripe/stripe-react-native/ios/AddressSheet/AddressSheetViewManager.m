//
//  AddressSheetViewManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(AddressSheetViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(presentationStyle, NSString)
RCT_EXPORT_VIEW_PROPERTY(animationStyle, NSString)
RCT_EXPORT_VIEW_PROPERTY(appearance, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(defaultValues, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(additionalFields, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(allowedCountries, NSArray)
RCT_EXPORT_VIEW_PROPERTY(autocompleteCountries, NSArray)
RCT_EXPORT_VIEW_PROPERTY(primaryButtonTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(sheetTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSubmitAction, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onErrorAction, RCTDirectEventBlock)
@end
