//
//  AddToWalletButtonManager.m
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(AddToWalletButtonManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(testEnv, BOOL)
RCT_EXPORT_VIEW_PROPERTY(iOSButtonStyle, NSString)
RCT_EXPORT_VIEW_PROPERTY(cardDetails, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(ephemeralKey, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onCompleteAction, RCTDirectEventBlock)
@end
