//
//  AddToWalletButtonManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

@interface ABI46_0_0RCT_EXTERN_REMAP_MODULE(AddToWalletButtonManager, ABI46_0_0AddToWalletButtonManager, ABI46_0_0RCTViewManager)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(testEnv, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(iOSButtonStyle, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(cardDetails, NSDictionary)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(ephemeralKey, NSDictionary)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, ABI46_0_0RCTDirectEventBlock)
@end
