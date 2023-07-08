//
//  AddressSheetViewManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(AddressSheetViewManager, ABI49_0_0AddressSheetViewManager, ABI49_0_0RCTViewManager)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(animationStyle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(appearance, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(defaultValues, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(additionalFields, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowedCountries, NSArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(autocompleteCountries, NSArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(primaryButtonTitle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(sheetTitle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onSubmitAction, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onErrorAction, ABI49_0_0RCTDirectEventBlock)
@end
