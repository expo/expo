//
//  AddToWalletButtonManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(AddToWalletButtonManager, ABI48_0_0AddToWalletButtonManager, ABI48_0_0RCTViewManager)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(testEnv, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(iOSButtonStyle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(cardDetails, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(ephemeralKey, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, ABI48_0_0RCTDirectEventBlock)
@end
