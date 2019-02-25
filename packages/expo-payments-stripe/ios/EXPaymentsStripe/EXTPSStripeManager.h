//
//  TPSStripeManager.h
//  TPSStripe
//
//  Created by Anton Petrov on 28.10.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <PassKit/PassKit.h>
#import <Stripe/Stripe.h>
#import <EXCore/EXUtilities.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXPaymentsStripe/EXTPSConvert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>


@interface EXTPSStripeManager : EXExportedModule <PKPaymentAuthorizationViewControllerDelegate, STPAddCardViewControllerDelegate, EXModuleRegistryConsumer>
@property (nonatomic) STPRedirectContext *redirectContext;
@end

/**
 It notifies react native code every time there is a change in the address in ApplePay sheet so that taxes can be accordingly updated.
 */
@interface ApplePayEventsManager : RCTEventEmitter <RCTBridgeModule>

@end

