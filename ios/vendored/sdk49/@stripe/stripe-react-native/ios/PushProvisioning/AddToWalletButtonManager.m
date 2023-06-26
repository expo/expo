//
//  AddToWalletButtonManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(AddToWalletButtonManager, ABI49_0_0AddToWalletButtonManager, ABI49_0_0RCTViewManager)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(testEnv, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(iOSButtonStyle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cardDetails, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(ephemeralKey, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, ABI49_0_0RCTDirectEventBlock)
@end
