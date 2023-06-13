//
//  AddToWalletButtonManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

@interface ABI47_0_0RCT_EXTERN_REMAP_MODULE(AddToWalletButtonManager, ABI47_0_0AddToWalletButtonManager, ABI47_0_0RCTViewManager)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(testEnv, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(iOSButtonStyle, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cardDetails, NSDictionary)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(ephemeralKey, NSDictionary)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, ABI47_0_0RCTDirectEventBlock)
@end
