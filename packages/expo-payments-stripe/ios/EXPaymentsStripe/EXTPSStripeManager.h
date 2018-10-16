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

@interface EXTPSStripeManager : EXExportedModule <PKPaymentAuthorizationViewControllerDelegate, STPAddCardViewControllerDelegate, EXModuleRegistryConsumer>

@end
