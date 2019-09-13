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
#import <ABI35_0_0UMCore/ABI35_0_0UMUtilities.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistry.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMUtilitiesInterface.h>
#import <ABI35_0_0EXPaymentsStripe/ABI35_0_0EXTPSConvert.h>

@interface ABI35_0_0EXTPSStripeManager : ABI35_0_0UMExportedModule <PKPaymentAuthorizationViewControllerDelegate, STPAddCardViewControllerDelegate, ABI35_0_0UMModuleRegistryConsumer>

@property (nonatomic) STPRedirectContext *redirectContext;

@end
