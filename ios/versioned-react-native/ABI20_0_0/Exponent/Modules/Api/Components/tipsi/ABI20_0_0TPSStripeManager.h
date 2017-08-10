//
//  ABI20_0_0TPSStripeManager.h
//  ABI20_0_0TPSStripe
//
//  Created by Anton Petrov on 28.10.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <PassKit/PassKit.h>
#import <Stripe/Stripe.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>

@interface ABI20_0_0TPSStripeManager : NSObject <ABI20_0_0RCTBridgeModule, PKPaymentAuthorizationViewControllerDelegate, STPAddCardViewControllerDelegate>

@end
