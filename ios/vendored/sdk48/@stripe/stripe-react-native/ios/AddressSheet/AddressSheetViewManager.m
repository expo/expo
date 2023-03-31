//
//  AddressSheetViewManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(AddressSheetViewManager, ABI48_0_0AddressSheetViewManager, ABI48_0_0RCTViewManager)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(presentationStyle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(animationStyle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(appearance, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(defaultValues, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(additionalFields, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(allowedCountries, NSArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(autocompleteCountries, NSArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(primaryButtonTitle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(sheetTitle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onSubmitAction, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onErrorAction, ABI48_0_0RCTDirectEventBlock)
@end
