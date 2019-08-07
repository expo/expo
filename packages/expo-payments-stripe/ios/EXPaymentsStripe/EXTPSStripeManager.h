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
#import <UMCore/UMUtilities.h>
#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <EXPaymentsStripe/EXTPSConvert.h>

@interface EXTPSStripeManager : UMExportedModule <PKPaymentAuthorizationViewControllerDelegate, STPAddCardViewControllerDelegate, UMModuleRegistryConsumer>

@property (nonatomic) STPRedirectContext *redirectContext;

@end
