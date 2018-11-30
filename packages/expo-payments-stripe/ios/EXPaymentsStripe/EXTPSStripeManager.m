//
//  TPSStripeManager.m
//  TPSStripe
//
//  Created by Anton Petrov on 28.10.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import <EXPaymentsStripe/EXTPSStripeManager.h>
#import <EXPaymentsStripe/EXTPSError.h>

NSString * const kErrorKeyCode = @"errorCode";
NSString * const kErrorKeyDescription = @"description";
NSString * const kErrorKeyBusy = @"busy";
NSString * const kErrorKeyApi = @"api";
NSString * const kErrorKeyRedirectSpecific = @"redirectSpecific";
NSString * const kErrorKeyCancelled = @"cancelled";
NSString * const kErrorKeySourceStatusCanceled = @"sourceStatusCanceled";
NSString * const kErrorKeySourceStatusPending = @"sourceStatusPending";
NSString * const kErrorKeySourceStatusFailed = @"sourceStatusFailed";
NSString * const kErrorKeySourceStatusUnknown = @"sourceStatusUnknown";
NSString * const kErrorKeyDeviceNotSupportsNativePay = @"deviceNotSupportsNativePay";
NSString * const kErrorKeyNoPaymentRequest = @"noPaymentRequest";
NSString * const kErrorKeyNoMerchantIdentifier = @"noMerchantIdentifier";
NSString * const kErrorKeyNoAmount = @"noAmount";

@interface EXTPSStripeManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

NSString * const TPSPaymentNetworkAmex = @"american_express";
NSString * const TPSPaymentNetworkDiscover = @"discover";
NSString * const TPSPaymentNetworkMasterCard = @"master_card";
NSString * const TPSPaymentNetworkVisa = @"visa";

@implementation EXTPSStripeManager
{
    NSString *publishableKey;
    NSString *merchantId;
    NSDictionary *errorCodes;

    EXPromiseResolveBlock promiseResolver;
    EXPromiseRejectBlock promiseRejector;

    BOOL requestIsCompleted;

    void (^applePayCompletion)(PKPaymentAuthorizationStatus);
    NSError *applePayStripeError;
}

- (instancetype)init {
    if ((self = [super init])) {
        requestIsCompleted = YES;
    }
    return self;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
    return @{
             @"TPSErrorDomain": TPSErrorDomain,
             @"TPSErrorCodeApplePayNotConfigured": [@(TPSErrorCodeApplePayNotConfigured) stringValue],
             @"TPSErrorCodePreviousRequestNotCompleted": [@(TPSErrorCodePreviousRequestNotCompleted) stringValue],
             @"TPSErrorCodeUserCancel": [@(TPSErrorCodeUserCancel) stringValue],
             };
}

EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"StripeModule";
}

EX_EXPORT_METHOD_AS(init, init:(NSDictionary *)options
                    errorCodes:(NSDictionary *)errors
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    publishableKey = options[@"publishableKey"];
    merchantId = options[@"merchantId"];
    errorCodes = errors;
    [Stripe setDefaultPublishableKey:publishableKey];
    resolve(@(YES));
}

EX_EXPORT_METHOD_AS(deviceSupportsApplePay, deviceSupportsApplePay:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject) {
    resolve(@([PKPaymentAuthorizationViewController canMakePayments]));
}

EX_EXPORT_METHOD_AS(canMakeApplePayPayments, canMakeApplePayPayments:(NSDictionary *)options
                  resolver:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject) {
    NSArray <NSString *> *paymentNetworksStrings =
    options[@"networks"] ?: [EXTPSStripeManager supportedPaymentNetworksStrings];

    NSArray <PKPaymentNetwork> *networks = [self paymentNetworks:paymentNetworksStrings];
    resolve(@([PKPaymentAuthorizationViewController canMakePaymentsUsingNetworks:networks]));
}

EX_EXPORT_METHOD_AS(completeApplePayRequest, completeApplePayRequest:(EXPromiseResolveBlock)resolve
                                 rejecter:(EXPromiseRejectBlock)reject) {
    if (applePayCompletion) {
        promiseResolver = resolve;
        [self resolveApplePayCompletion:PKPaymentAuthorizationStatusSuccess];
    } else {
        resolve(nil);
    }
}

EX_EXPORT_METHOD_AS(cancelApplePayRequest, cancelApplePayRequest:(EXPromiseResolveBlock)resolve
                               rejecter:(EXPromiseRejectBlock)reject) {
    if (applePayCompletion) {
        promiseResolver = resolve;
        [self resolveApplePayCompletion:PKPaymentAuthorizationStatusFailure];
    } else {
        resolve(nil);
    }
}

EX_EXPORT_METHOD_AS(createTokenWithCard, createTokenWithCard:(NSDictionary *)params
                             resolver:(EXPromiseResolveBlock)resolve
                             rejecter:(EXPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyBusy];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return;
    }

    requestIsCompleted = NO;

    STPCardParams *cardParams = [[STPCardParams alloc] init];

    [cardParams setNumber: params[@"number"]];
    [cardParams setExpMonth: [params[@"expMonth"] integerValue]];
    [cardParams setExpYear: [params[@"expYear"] integerValue]];
    [cardParams setCvc: params[@"cvc"]];

    [cardParams setCurrency: params[@"currency"]];
    [cardParams setName: params[@"name"]];
    [cardParams setAddressLine1: params[@"addressLine1"]];
    [cardParams setAddressLine2: params[@"addressLine2"]];
    [cardParams setAddressCity: params[@"addressCity"]];
    [cardParams setAddressState: params[@"addressState"]];
    [cardParams setAddressCountry: params[@"addressCountry"]];
    [cardParams setAddressZip: params[@"addressZip"]];

    STPAPIClient *stripeAPIClient = [self newAPIClient];

    [stripeAPIClient createTokenWithCard:cardParams completion:^(STPToken *token, NSError *error) {
        requestIsCompleted = YES;

        if (error) {
            NSDictionary *jsError = [errorCodes valueForKey:kErrorKeyApi];
            [self rejectPromiseWithCode:jsError[kErrorKeyCode] message:error.localizedDescription];
        } else {
            resolve([self convertTokenObject:token]);
        }
    }];
}

EX_EXPORT_METHOD_AS(createTokenWithBankAccount, createTokenWithBankAccount:(NSDictionary *)params
                  resolver:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyBusy];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return;
    }

    requestIsCompleted = NO;

    STPBankAccountParams *bankAccount = [[STPBankAccountParams alloc] init];

    [bankAccount setAccountNumber: params[@"accountNumber"]];
    [bankAccount setCountry: params[@"countryCode"]];
    [bankAccount setCurrency: params[@"currency"]];
    [bankAccount setRoutingNumber: params[@"routingNumber"]];
    [bankAccount setAccountHolderName: params[@"accountHolderName"]];
    STPBankAccountHolderType accountHolderType =
    [EXTPSConvert holderType:params[@"accountHolderType"]];
    [bankAccount setAccountHolderType: accountHolderType];

    STPAPIClient *stripeAPIClient = [self newAPIClient];

    [stripeAPIClient createTokenWithBankAccount:bankAccount completion:^(STPToken *token, NSError *error) {
        requestIsCompleted = YES;

        if (error) {
            NSDictionary *jsError = [errorCodes valueForKey:kErrorKeyApi];
            [self rejectPromiseWithCode:jsError[kErrorKeyCode] message:error.localizedDescription];
        } else {
            resolve([self convertTokenObject:token]);
        }
    }];
}

EX_EXPORT_METHOD_AS(createSourceWithParams, createSourceWithParams:(NSDictionary *)params
                  resolver:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyBusy];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return;
    }

    requestIsCompleted = NO;

    NSString *sourceType = params[@"type"];
    STPSourceParams *sourceParams;
    if ([sourceType isEqualToString:@"bancontact"]) {
         sourceParams = [STPSourceParams bancontactParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] name:params[@"name"] returnURL:params[@"returnURL"] statementDescriptor:params[@"statementDescriptor"]];
    }
    if ([sourceType isEqualToString:@"giropay"]) {
         sourceParams = [STPSourceParams giropayParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] name:params[@"name"] returnURL:params[@"returnURL"] statementDescriptor:params[@"statementDescriptor"]];
    }
    if ([sourceType isEqualToString:@"ideal"]) {
         sourceParams = [STPSourceParams idealParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] name:params[@"name"] returnURL:params[@"returnURL"] statementDescriptor:params[@"statementDescriptor"] bank:params[@"bank"]];
    }
    if ([sourceType isEqualToString:@"sepaDebit"]) {
         sourceParams = [STPSourceParams sepaDebitParamsWithName:params[@"name"] iban:params[@"iban"] addressLine1:params[@"addressLine1"] city:params[@"city"] postalCode:params[@"postalCode"] country:params[@"country"]];
    }
    if ([sourceType isEqualToString:@"sofort"]) {
         sourceParams = [STPSourceParams sofortParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] returnURL:params[@"returnURL"] country:params[@"country"] statementDescriptor:params[@"statementDescriptor"]];
    }
    if ([sourceType isEqualToString:@"threeDSecure"]) {
         sourceParams = [STPSourceParams threeDSecureParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] currency:params[@"currency"] returnURL:params[@"returnURL"] card:params[@"card"]];
    }
    if ([sourceType isEqualToString:@"alipay"]) {
         sourceParams = [STPSourceParams alipayParamsWithAmount:[[params objectForKey:@"amount"] unsignedIntegerValue] currency:params[@"currency"] returnURL:params[@"returnURL"]];
    }

    [[STPAPIClient sharedClient] createSourceWithParams:sourceParams completion:^(STPSource *source, NSError *error) {
      requestIsCompleted = YES;
      
      if (error) {
        reject(nil, nil, error);
      } else {
        if (source.redirect) {
            self.redirectContext = [[STPRedirectContext alloc] initWithSource:source completion:^(NSString *sourceID, NSString *clientSecret, NSError *error) {
            if (error) {
              NSDictionary *jsError = [errorCodes valueForKey:kErrorKeyRedirectSpecific];
              reject(jsError[kErrorKeyCode], error.localizedDescription, nil);
            } else {
              [[STPAPIClient sharedClient] startPollingSourceWithId:sourceID clientSecret:clientSecret timeout:10 completion:^(STPSource *source, NSError *error) {
                if (error) {
                  NSDictionary *jsError = [errorCodes valueForKey:kErrorKeyApi];
                  reject(jsError[kErrorKeyCode], error.localizedDescription, nil);
                } else {
                  switch (source.status) {
                    case STPSourceStatusChargeable:
                    case STPSourceStatusConsumed:
                      resolve([self convertSourceObject:source]);
                      break;
                    case STPSourceStatusCanceled: {
                        NSDictionary *error = [errorCodes valueForKey:kErrorKeySourceStatusCanceled];
                        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
                    }
                      break;
                    case STPSourceStatusPending: {
                        NSDictionary *error = [errorCodes valueForKey:kErrorKeySourceStatusPending];
                        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
                    }
                        break;
                    case STPSourceStatusFailed: {
                        NSDictionary *error = [errorCodes valueForKey:kErrorKeySourceStatusFailed];
                        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
                    }
                        break;
                    case STPSourceStatusUnknown: {
                        NSDictionary *error = [errorCodes valueForKey:kErrorKeySourceStatusUnknown];
                        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
                    }
                      break;
                  }
                }
              }];
            }
          }];
          [self.redirectContext startSafariAppRedirectFlow];
        } else {
          resolve([self convertSourceObject:source]);
        }
      }
  }];
}

EX_EXPORT_METHOD_AS(paymentRequestWithCardForm, paymentRequestWithCardForm:(NSDictionary *)options
                                    resolver:(EXPromiseResolveBlock)resolve
                                    rejecter:(EXPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyBusy];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return;
    }

    requestIsCompleted = NO;
    // Save promise handlers to use in `paymentAuthorizationViewController`
    promiseResolver = resolve;
    promiseRejector = reject;

    NSUInteger requiredBillingAddressFields = [self billingType:options[@"requiredBillingAddressFields"]];
    NSString *companyName = options[@"companyName"] ? options[@"companyName"] : @"";
    STPUserInformation *prefilledInformation = [self userInformation:options[@"prefilledInformation"]];
    NSString *managedAccountCurrency = options[@"managedAccountCurrency"];
    NSString *nextPublishableKey = options[@"publishableKey"] ? options[@"publishableKey"] : publishableKey;
    UIModalPresentationStyle formPresentation = [self formPresentation:options[@"presentation"]];
    STPTheme *theme = [self formTheme:options[@"theme"]];

    STPPaymentConfiguration *configuration = [[STPPaymentConfiguration alloc] init];
    [configuration setRequiredBillingAddressFields:requiredBillingAddressFields];
    [configuration setCompanyName:companyName];
    [configuration setPublishableKey:nextPublishableKey];

    [configuration setCreateCardSources:[options[@"createCardSource"] boolValue]];


    STPAddCardViewController *addCardViewController = [[STPAddCardViewController alloc] initWithConfiguration:configuration theme:theme];
    [addCardViewController setDelegate:self];
    [addCardViewController setPrefilledInformation:prefilledInformation];
    [addCardViewController setManagedAccountCurrency:managedAccountCurrency];
    // STPAddCardViewController must be shown inside a UINavigationController.
    UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:addCardViewController];
    [navigationController setModalPresentationStyle:formPresentation];
    navigationController.navigationBar.stp_theme = theme;
    [[self getViewController] presentViewController:navigationController animated:YES completion:nil];
}

EX_EXPORT_METHOD_AS(paymentRequestWithApplePay, paymentRequestWithApplePay:(NSArray *)items
                                 withOptions:(NSDictionary *)options
                                    resolver:(EXPromiseResolveBlock)resolve
                                    rejecter:(EXPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyBusy];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return;
    }

    requestIsCompleted = NO;
    // Save promise handlers to use in `paymentAuthorizationViewController`
    promiseResolver = resolve;
    promiseRejector = reject;

    NSUInteger requiredShippingAddressFields = [self applePayAddressFields:options[@"requiredShippingAddressFields"]];
    NSUInteger requiredBillingAddressFields = [self applePayAddressFields:options[@"requiredBillingAddressFields"]];
    PKShippingType shippingType = [self applePayShippingType:options[@"shippingType"]];
    NSMutableArray *shippingMethodsItems = options[@"shippingMethods"] ? options[@"shippingMethods"] : [NSMutableArray array];
    NSString* currencyCode = options[@"currencyCode"] ? options[@"currencyCode"] : @"USD";
    NSString* countryCode = options[@"countryCode"] ? options[@"countryCode"] : @"US";

    NSMutableArray *shippingMethods = [NSMutableArray array];

    for (NSDictionary *item in shippingMethodsItems) {
        PKShippingMethod *shippingItem = [[PKShippingMethod alloc] init];
        shippingItem.label = item[@"label"];
        shippingItem.detail = item[@"detail"];
        shippingItem.amount = [NSDecimalNumber decimalNumberWithString:item[@"amount"]];
        shippingItem.identifier = item[@"id"];
        [shippingMethods addObject:shippingItem];
    }

    NSMutableArray *summaryItems = [NSMutableArray array];

    for (NSDictionary *item in items) {
        PKPaymentSummaryItem *summaryItem = [[PKPaymentSummaryItem alloc] init];
        summaryItem.label = item[@"label"];
        summaryItem.amount = [NSDecimalNumber decimalNumberWithString:item[@"amount"]];
        summaryItem.type = [@"pending" isEqualToString:item[@"type"]] ? PKPaymentSummaryItemTypePending : PKPaymentSummaryItemTypeFinal;
        [summaryItems addObject:summaryItem];
    }

    PKPaymentRequest *paymentRequest = [Stripe paymentRequestWithMerchantIdentifier:merchantId country:countryCode currency:currencyCode];

    [paymentRequest setRequiredShippingAddressFields:requiredShippingAddressFields];
    [paymentRequest setRequiredBillingAddressFields:requiredBillingAddressFields];
    [paymentRequest setPaymentSummaryItems:summaryItems];
    [paymentRequest setShippingMethods:shippingMethods];
    [paymentRequest setShippingType:shippingType];

    if ([self canSubmitPaymentRequest:paymentRequest rejecter:reject]) {
        PKPaymentAuthorizationViewController *paymentAuthorizationVC = [[PKPaymentAuthorizationViewController alloc] initWithPaymentRequest:paymentRequest];
        paymentAuthorizationVC.delegate = self;
        [[self getViewController] presentViewController:paymentAuthorizationVC animated:YES completion:nil];
    } else {
        // There is a problem with your Apple Pay configuration.
        [self resetPromiseCallbacks];
        requestIsCompleted = YES;
    }
}

EX_EXPORT_METHOD_AS(openApplePaySetup, openApplePaySetup:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    PKPassLibrary *library = [[PKPassLibrary alloc] init];

    // Here we should check, if openPaymentSetup selector exist
    if ([library respondsToSelector:NSSelectorFromString(@"openPaymentSetup")]) {
        [library openPaymentSetup];
    }
}

#pragma mark - Private

-(UIViewController*) getViewController {
  return [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)] currentViewController];
}

- (void)resolvePromise:(id)result {
    if (promiseResolver) {
        promiseResolver(result);
    }
    [self resetPromiseCallbacks];
}

- (void)rejectPromiseWithCode:(NSString *)code message:(NSString *)message {
    if (promiseRejector) {
        promiseRejector(code, message, nil);
    }
    [self resetPromiseCallbacks];
}

- (void)resetPromiseCallbacks {
    promiseResolver = nil;
    promiseRejector = nil;
}

- (void)resolveApplePayCompletion:(PKPaymentAuthorizationStatus)status {
    if (applePayCompletion) {
        applePayCompletion(status);
    }
    [self resetApplePayCallback];
}

- (void)resetApplePayCallback {
    applePayCompletion = nil;
}

- (BOOL)canSubmitPaymentRequest:(PKPaymentRequest *)paymentRequest rejecter:(EXPromiseRejectBlock)reject {
    if (![Stripe deviceSupportsApplePay]) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyDeviceNotSupportsNativePay];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return NO;
    }
    if (paymentRequest == nil) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyNoPaymentRequest];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return NO;
    }
    if (paymentRequest.merchantIdentifier == nil) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyNoMerchantIdentifier];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return NO;
    }
    if ([[[paymentRequest.paymentSummaryItems lastObject] amount] floatValue] == 0) {
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyNoAmount];
        reject(error[kErrorKeyCode], error[kErrorKeyDescription], nil);
        return NO;
    }
    return YES;
}

#pragma mark - STPAddCardViewControllerDelegate

- (void)addCardViewController:(STPAddCardViewController *)controller
               didCreateToken:(STPToken *)token
                   completion:(STPErrorBlock)completion {
    [[self getViewController] dismissViewControllerAnimated:YES completion:nil];

    requestIsCompleted = YES;
    completion(nil);
    [self resolvePromise:[self convertTokenObject:token]];
}

- (void)addCardViewController:(STPAddCardViewController *)controller
               didCreateSource:(STPSource *)source
                   completion:(STPErrorBlock)completion {
    [[self getViewController] dismissViewControllerAnimated:YES completion:nil];
    
    requestIsCompleted = YES;
    completion(nil);
    [self resolvePromise:[self convertSourceObject:source]];
}

- (void)addCardViewControllerDidCancel:(STPAddCardViewController *)addCardViewController {
    [[self getViewController] dismissViewControllerAnimated:YES completion:nil];

    if (!requestIsCompleted) {
        requestIsCompleted = YES;
        NSDictionary *error = [errorCodes valueForKey:kErrorKeyCancelled];
        [self rejectPromiseWithCode:error[kErrorKeyCode] message:error[kErrorKeyDescription]];
    }

}

#pragma mark PKPaymentAuthorizationViewControllerDelegate

- (void)paymentAuthorizationViewController:(PKPaymentAuthorizationViewController *)controller
                       didAuthorizePayment:(PKPayment *)payment
                                completion:(void (^)(PKPaymentAuthorizationStatus))completion {
    // Save for deffered call
    applePayCompletion = completion;

    STPAPIClient *stripeAPIClient = [self newAPIClient];

    [stripeAPIClient createTokenWithPayment:payment completion:^(STPToken * _Nullable token, NSError * _Nullable error) {
        requestIsCompleted = YES;

        if (error) {
            // Save for deffered use
            applePayStripeError = error;
            [self resolveApplePayCompletion:PKPaymentAuthorizationStatusFailure];
        } else {
            NSDictionary *result = [self convertTokenObject:token];
            NSDictionary *extra = @{
                @"billingContact": [self contactDetails:payment.billingContact] ?: [NSNull null],
                @"shippingContact": [self contactDetails:payment.shippingContact] ?: [NSNull null],
                @"shippingMethod": [self shippingDetails:payment.shippingMethod] ?: [NSNull null]
            };

            [result setValue:extra forKey:@"extra"];

            [self resolvePromise:result];
        }
    }];
}


- (void)paymentAuthorizationViewControllerDidFinish:(PKPaymentAuthorizationViewController *)controller {
    [self resetApplePayCallback];

    void(^completion)() = ^{
        if (!requestIsCompleted) {
            requestIsCompleted = YES;

            NSDictionary *error = [errorCodes valueForKey:kErrorKeyCancelled];
            [self rejectPromiseWithCode:error[kErrorKeyCode] message:error[kErrorKeyDescription]];
        } else {
            if (applePayStripeError) {
                NSDictionary *error = [errorCodes valueForKey:kErrorKeyApi];
                [self rejectPromiseWithCode:error[kErrorKeyCode] message:applePayStripeError.localizedDescription];
                applePayStripeError = nil;
            } else {
                [self resolvePromise:nil];
            }
        }
    };

    [[self getViewController] dismissViewControllerAnimated:YES completion:completion];
}

- (STPAPIClient *)newAPIClient {
    return [[STPAPIClient alloc] initWithPublishableKey:[Stripe defaultPublishableKey]];
}

- (NSDictionary *)convertTokenObject:(STPToken*)token {
    NSMutableDictionary *result = [@{} mutableCopy];

    // Token
    [result setValue:token.tokenId forKey:@"tokenId"];
    [result setValue:@([token.created timeIntervalSince1970]) forKey:@"created"];
    [result setValue:@(token.livemode) forKey:@"livemode"];

    // Card
    if (token.card) {
        NSMutableDictionary *card = [@{} mutableCopy];
        [result setValue:card forKey:@"card"];

        [card setValue:token.card.stripeID forKey:@"cardId"];

        [card setValue:[self cardBrand:token.card.brand] forKey:@"brand"];
        [card setValue:[self cardFunding:token.card.funding] forKey:@"funding"];
        [card setValue:token.card.last4 forKey:@"last4"];
        [card setValue:token.card.dynamicLast4 forKey:@"dynamicLast4"];
        [card setValue:@(token.card.isApplePayCard) forKey:@"isApplePayCard"];
        [card setValue:@(token.card.expMonth) forKey:@"expMonth"];
        [card setValue:@(token.card.expYear) forKey:@"expYear"];
        [card setValue:token.card.country forKey:@"country"];
        [card setValue:token.card.currency forKey:@"currency"];

        [card setValue:token.card.name forKey:@"name"];
        [card setValue:token.card.address.line1 forKey:@"addressLine1"];
        [card setValue:token.card.address.line2 forKey:@"addressLine2"];
        [card setValue:token.card.address.city forKey:@"addressCity"];
        [card setValue:token.card.address.state forKey:@"addressState"];
        [card setValue:token.card.address.country forKey:@"addressCountry"];
        [card setValue:token.card.address.postalCode forKey:@"addressZip"];
    }

    // Bank Account
    if (token.bankAccount) {
        NSMutableDictionary *bankAccount = [@{} mutableCopy];
        [result setValue:bankAccount forKey:@"bankAccount"];

        NSString *bankAccountStatusString =
        [EXTPSConvert STPBankAccountStatusToString:token.bankAccount.status];
        [bankAccount setValue:bankAccountStatusString forKey:@"status"];
        [bankAccount setValue:token.bankAccount.country forKey:@"countryCode"];
        [bankAccount setValue:token.bankAccount.currency forKey:@"currency"];
        [bankAccount setValue:token.bankAccount.stripeID forKey:@"bankAccountId"];
        [bankAccount setValue:token.bankAccount.bankName forKey:@"bankName"];
        [bankAccount setValue:token.bankAccount.last4 forKey:@"last4"];
        [bankAccount setValue:token.bankAccount.accountHolderName forKey:@"accountHolderName"];
        NSString *bankAccountHolderTypeString =
        [EXTPSConvert STPBankAccountHolderTypeToString:token.bankAccount.accountHolderType];
        [bankAccount setValue:bankAccountHolderTypeString forKey:@"accountHolderType"];
    }

    return result;
}

- (NSDictionary *)convertSourceObject:(STPSource*)source {
    NSMutableDictionary *result = [@{} mutableCopy];

    // Source
    [result setValue:source.clientSecret forKey:@"clientSecret"];
    [result setValue:@([source.created timeIntervalSince1970]) forKey:@"created"];
    [result setValue:source.currency forKey:@"currency"];
    [result setValue:@(source.livemode) forKey:@"livemode"];
    [result setValue:source.amount forKey:@"amount"];
    [result setValue:source.stripeID forKey:@"sourceId"];

    // Flow
    [result setValue:[self sourceFlow:source.flow] forKey:@"flow"];

    // Metadata
    if (source.metadata) {
        [result setValue:source.metadata forKey:@"metadata"];
    }

    // Owner
    if (source.owner) {
        NSMutableDictionary *owner = [@{} mutableCopy];
        [result setValue:owner forKey:@"owner"];

        if (source.owner.address) {
            [owner setObject:source.owner.address forKey:@"address"];
        }
        [owner setValue:source.owner.email forKey:@"email"];
        [owner setValue:source.owner.name forKey:@"name"];
        [owner setValue:source.owner.phone forKey:@"phone"];
        if (source.owner.verifiedAddress) {
            [owner setObject:source.owner.verifiedAddress forKey:@"verifiedAddress"];
        }
        [owner setValue:source.owner.verifiedEmail forKey:@"verifiedEmail"];
        [owner setValue:source.owner.verifiedName forKey:@"verifiedName"];
        [owner setValue:source.owner.verifiedPhone forKey:@"verifiedPhone"];
    }

    // Details
    if (source.details) {
        [result setValue:source.details forKey:@"details"];
    }

    // Receiver
    if (source.receiver) {
        NSMutableDictionary *receiver = [@{} mutableCopy];
        [result setValue:receiver forKey:@"receiver"];

        [receiver setValue:source.receiver.address forKey:@"address"];
        [receiver setValue:source.receiver.amountCharged forKey:@"amountCharged"];
        [receiver setValue:source.receiver.amountReceived forKey:@"amountReceived"];
        [receiver setValue:source.receiver.amountReturned forKey:@"amountReturned"];
    }

    // Redirect
    if (source.redirect) {
        NSMutableDictionary *redirect = [@{} mutableCopy];
        [result setValue:redirect forKey:@"redirect"];
        NSString *returnURL = source.redirect.returnURL.absoluteString;
        [redirect setValue:returnURL forKey:@"returnURL"];
        NSString *url = source.redirect.url.absoluteString;
        [redirect setValue:url forKey:@"url"];
        [redirect setValue:[self sourceRedirectStatus:source.redirect.status] forKey:@"status"];
    }

    // Verification
    if (source.verification) {
        NSMutableDictionary *verification = [@{} mutableCopy];
        [result setValue:verification forKey:@"verification"];

        [verification setValue:source.verification.attemptsRemaining forKey:@"attemptsRemaining"];
        [verification setValue:[self sourceVerificationStatus:source.verification.status] forKey:@"status"];
    }

    // Status
    [result setValue:[self sourceStatus:source.status] forKey:@"status"];

    // Type
    [result setValue:[self sourceType:source.type] forKey:@"type"];

    // Usage
    [result setValue:[self sourceUsage:source.usage] forKey:@"usage"];

    // CardDetails
    if (source.cardDetails) {
        NSMutableDictionary *cardDetails = [@{} mutableCopy];
        [result setValue:cardDetails forKey:@"cardDetails"];

        [cardDetails setValue:source.cardDetails.last4 forKey:@"last4"];
        [cardDetails setValue:@(source.cardDetails.expMonth) forKey:@"expMonth"];
        [cardDetails setValue:@(source.cardDetails.expYear) forKey:@"expYear"];
        [cardDetails setValue:[self cardBrand:source.cardDetails.brand] forKey:@"brand"];
        [cardDetails setValue:[self cardFunding:source.cardDetails.funding] forKey:@"funding"];
        [cardDetails setValue:source.cardDetails.country forKey:@"country"];
        [cardDetails setValue:[self card3DSecureStatus:source.cardDetails.threeDSecure] forKey:@"threeDSecure"];
    }

    // SepaDebitDetails
    if (source.sepaDebitDetails) {
        NSMutableDictionary *sepaDebitDetails = [@{} mutableCopy];
        [result setValue:sepaDebitDetails forKey:@"sepaDebitDetails"];

        [sepaDebitDetails setValue:source.sepaDebitDetails.last4 forKey:@"last4"];
        [sepaDebitDetails setValue:source.sepaDebitDetails.bankCode forKey:@"bankCode"];
        [sepaDebitDetails setValue:source.sepaDebitDetails.country forKey:@"country"];
        [sepaDebitDetails setValue:source.sepaDebitDetails.fingerprint forKey:@"fingerprint"];
        [sepaDebitDetails setValue:source.sepaDebitDetails.mandateReference forKey:@"mandateReference"];
        NSString *mandateURL = source.sepaDebitDetails.mandateURL.absoluteString;
        [sepaDebitDetails setValue:mandateURL forKey:@"mandateURL"];
    }

    return result;
}

- (NSString *)cardBrand:(STPCardBrand)inputBrand {
    switch (inputBrand) {
        case STPCardBrandJCB:
            return @"JCB";
        case STPCardBrandAmex:
            return @"American Express";
        case STPCardBrandVisa:
            return @"Visa";
        case STPCardBrandDiscover:
            return @"Discover";
        case STPCardBrandDinersClub:
            return @"Diners Club";
        case STPCardBrandMasterCard:
            return @"MasterCard";
        default:
            return @"Unknown";
    }
}

- (NSString *)cardFunding:(STPCardFundingType)inputFunding {
    switch (inputFunding) {
        case STPCardFundingTypeDebit:
            return @"debit";
        case STPCardFundingTypeCredit:
            return @"credit";
        case STPCardFundingTypePrepaid:
            return @"prepaid";
        case STPCardFundingTypeOther:
        default:
            return @"unknown";
    }
}

- (NSString *)card3DSecureStatus:(STPSourceCard3DSecureStatus)inputStatus {
    switch (inputStatus) {
        case STPSourceCard3DSecureStatusRequired:
            return @"required";
        case STPSourceCard3DSecureStatusOptional:
            return @"optional";
        case STPSourceCard3DSecureStatusNotSupported:
            return @"notSupported";
        case STPSourceCard3DSecureStatusUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceFlow:(STPSourceFlow)inputFlow {
    switch (inputFlow) {
        case STPSourceFlowNone:
            return @"none";
        case STPSourceFlowRedirect:
            return @"redirect";
        case STPSourceFlowCodeVerification:
            return @"codeVerification";
        case STPSourceFlowReceiver:
            return @"receiver";
        case STPSourceFlowUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceRedirectStatus:(STPSourceRedirectStatus)inputStatus {
    switch (inputStatus) {
        case STPSourceRedirectStatusPending:
            return @"pending";
        case STPSourceRedirectStatusSucceeded:
            return @"succeeded";
        case STPSourceRedirectStatusFailed:
            return @"failed";
        case STPSourceRedirectStatusUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceVerificationStatus:(STPSourceVerificationStatus)inputStatus {
    switch (inputStatus) {
        case STPSourceVerificationStatusPending:
            return @"pending";
        case STPSourceVerificationStatusSucceeded:
            return @"succeeded";
        case STPSourceVerificationStatusFailed:
            return @"failed";
        case STPSourceVerificationStatusUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceStatus:(STPSourceStatus)inputStatus {
    switch (inputStatus) {
        case STPSourceStatusPending:
            return @"pending";
        case STPSourceStatusChargeable:
            return @"chargable";
        case STPSourceStatusConsumed:
            return @"consumed";
        case STPSourceStatusCanceled:
            return @"canceled";
        case STPSourceStatusFailed:
            return @"failed";
        case STPSourceStatusUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceType:(STPSourceType)inputType {
    switch (inputType) {
        case STPSourceTypeBancontact:
            return @"bancontact";
        case STPSourceTypeGiropay:
            return @"giropay";
        case STPSourceTypeIDEAL:
            return @"ideal";
        case STPSourceTypeSEPADebit:
            return @"sepaDebit";
        case STPSourceTypeSofort:
            return @"sofort";
        case STPSourceTypeThreeDSecure:
            return @"threeDSecure";
        case STPSourceTypeAlipay:
            return @"alipay";
        case STPSourceTypeUnknown:
        default:
            return @"unknown";
    }
}

- (NSString *)sourceUsage:(STPSourceUsage)inputUsage {
    switch (inputUsage) {
        case STPSourceUsageReusable:
            return @"reusable";
        case STPSourceUsageSingleUse:
            return @"singleUse";
        case STPSourceUsageUnknown:
        default:
            return @"unknown";
    }
}

- (NSDictionary *)contactDetails:(PKContact*)inputContact {
    NSMutableDictionary *contactDetails = [[NSMutableDictionary alloc] init];

    if (inputContact.name) {
        [contactDetails setValue:[NSPersonNameComponentsFormatter localizedStringFromPersonNameComponents:inputContact.name style:NSPersonNameComponentsFormatterStyleDefault options:0] forKey:@"name"];
    }

    if (inputContact.phoneNumber) {
        [contactDetails setValue:[inputContact.phoneNumber stringValue] forKey:@"phoneNumber"];
    }

    if (inputContact.emailAddress) {
        [contactDetails setValue:inputContact.emailAddress forKey:@"emailAddress"];
    }

    if (inputContact.supplementarySubLocality) {
        [contactDetails setValue:inputContact.supplementarySubLocality forKey:@"supplementarySubLocality"];
    }

    for (NSString *elem in @[@"street", @"city", @"state", @"country", @"ISOCountryCode", @"postalCode"]) {
        if ([inputContact.postalAddress respondsToSelector:NSSelectorFromString(elem)]) {
            [contactDetails setValue:[inputContact.postalAddress valueForKey:elem] forKey:elem];
        }
    }
    if ([contactDetails count] == 0) {
        return nil;
    }

    return contactDetails;
}

- (NSDictionary *)shippingDetails:(PKShippingMethod*)inputShipping {
    NSMutableDictionary *shippingDetails = [[NSMutableDictionary alloc] init];

    if (inputShipping.label) {
        [shippingDetails setValue:inputShipping.label forKey:@"label"];
    }

    if (inputShipping.amount) {
        [shippingDetails setValue:[[self numberFormatter] stringFromNumber: inputShipping.amount] forKey:@"amount"];
    }

    if (inputShipping.detail) {
        [shippingDetails setValue:inputShipping.detail forKey:@"detail"];
    }

    if (inputShipping.identifier) {
        [shippingDetails setValue:inputShipping.identifier forKey:@"id"];
    }

    if ([shippingDetails count] == 0) {
        return nil;
    }

    return shippingDetails;
}

- (PKAddressField)applePayAddressFields:(NSArray <NSString *> *)addressFieldStrings {
    PKAddressField addressField = PKAddressFieldNone;

    for (NSString *addressFieldString in addressFieldStrings) {
        addressField |= [self applePayAddressField:addressFieldString];
    }

    return addressField;
}

- (PKAddressField)applePayAddressField:(NSString *)addressFieldString {
    PKAddressField addressField = PKAddressFieldNone;
    if ([addressFieldString isEqualToString:@"postal_address"]) {
        addressField = PKAddressFieldPostalAddress;
    }
    if ([addressFieldString isEqualToString:@"phone"]) {
        addressField = PKAddressFieldPhone;
    }
    if ([addressFieldString isEqualToString:@"email"]) {
        addressField = PKAddressFieldEmail;
    }
    if ([addressFieldString isEqualToString:@"name"]) {
        addressField = PKAddressFieldName;
    }
    if ([addressFieldString isEqualToString:@"all"]) {
        addressField = PKAddressFieldAll;
    }
    return addressField;
}

- (PKShippingType)applePayShippingType:(NSString*)inputType {
    PKShippingType shippingType = PKShippingTypeShipping;
    if ([inputType isEqualToString:@"delivery"]) {
        shippingType = PKShippingTypeDelivery;
    }
    if ([inputType isEqualToString:@"store_pickup"]) {
        shippingType = PKShippingTypeStorePickup;
    }
    if ([inputType isEqualToString:@"service_pickup"]) {
        shippingType = PKShippingTypeServicePickup;
    }

    return shippingType;
}

- (STPBillingAddressFields)billingType:(NSString*)inputType {
    if ([inputType isEqualToString:@"zip"]) {
        return STPBillingAddressFieldsZip;
    }
    if ([inputType isEqualToString:@"full"]) {
        return STPBillingAddressFieldsFull;
    }
    return STPBillingAddressFieldsNone;
}

- (STPUserInformation *)userInformation:(NSDictionary*)inputInformation {
    STPUserInformation *userInformation = [[STPUserInformation alloc] init];

    [userInformation setBillingAddress: [self address:inputInformation[@"billingAddress"]]];
    [userInformation setShippingAddress: [self address:inputInformation[@"shippingAddress"]]];

    return userInformation;
}

- (STPAddress *)address:(NSDictionary*)inputAddress {
    STPAddress *address = [[STPAddress alloc] init];

    [address setName:inputAddress[@"name"]];
    [address setLine1:inputAddress[@"line1"]];
    [address setLine2:inputAddress[@"line2"]];
    [address setCity:inputAddress[@"city"]];
    [address setState:inputAddress[@"state"]];
    [address setPostalCode:inputAddress[@"postalCode"]];
    [address setCountry:inputAddress[@"country"]];
    [address setPhone:inputAddress[@"phone"]];
    [address setEmail:inputAddress[@"email"]];

    return address;
}

- (STPTheme *)formTheme:(NSDictionary*)options {
    STPTheme *theme = [[STPTheme alloc] init];

    [theme setPrimaryBackgroundColor:[EXTPSConvert UIColor:options[@"primaryBackgroundColor"]]];
    [theme setSecondaryBackgroundColor:[EXTPSConvert UIColor:options[@"secondaryBackgroundColor"]]];
    [theme setPrimaryForegroundColor:[EXTPSConvert UIColor:options[@"primaryForegroundColor"]]];
    [theme setSecondaryForegroundColor:[EXTPSConvert UIColor:options[@"secondaryForegroundColor"]]];
    [theme setAccentColor:[EXTPSConvert UIColor:options[@"accentColor"]]];
    [theme setErrorColor:[EXTPSConvert UIColor:options[@"errorColor"]]];
    [theme setErrorColor:[EXTPSConvert UIColor:options[@"errorColor"]]];
    // TODO: process font vars

    return theme;
}

- (UIModalPresentationStyle)formPresentation:(NSString*)inputType {
    if ([inputType isEqualToString:@"pageSheet"])
        return UIModalPresentationPageSheet;
    if ([inputType isEqualToString:@"formSheet"])
        return UIModalPresentationFormSheet;

    return UIModalPresentationFullScreen;
}

+ (NSArray <NSString *> *)supportedPaymentNetworksStrings {
    return @[
             TPSPaymentNetworkAmex,
             TPSPaymentNetworkDiscover,
             TPSPaymentNetworkMasterCard,
             TPSPaymentNetworkVisa,
             ];
}

- (NSArray <PKPaymentNetwork> *)paymentNetworks:(NSArray <NSString *> *)paymentNetworkStrings {
    NSMutableArray <PKPaymentNetwork> *results = [@[] mutableCopy];

    for (NSString *paymentNetworkString in paymentNetworkStrings) {
        PKPaymentNetwork paymentNetwork = [self paymentNetwork:paymentNetworkString];
        if (paymentNetwork) {
            [results addObject:paymentNetwork];
        }
    }

    return [results copy];
}

- (PKPaymentNetwork)paymentNetwork:(NSString *)paymentNetworkString {
    static NSDictionary *paymentNetworksMap;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSMutableDictionary *mutableMap = [@{} mutableCopy];

        if ((&PKPaymentNetworkAmex) != NULL) {
            mutableMap[TPSPaymentNetworkAmex] = PKPaymentNetworkAmex;
        }

        if ((&PKPaymentNetworkDiscover) != NULL) {
            mutableMap[TPSPaymentNetworkDiscover] = PKPaymentNetworkDiscover;
        }

        if ((&PKPaymentNetworkMasterCard) != NULL) {
            mutableMap[TPSPaymentNetworkMasterCard] = PKPaymentNetworkMasterCard;
        }

        if ((&PKPaymentNetworkVisa) != NULL) {
            mutableMap[TPSPaymentNetworkVisa] = PKPaymentNetworkVisa;
        }

        paymentNetworksMap = [mutableMap copy];
    });

    return paymentNetworksMap[paymentNetworkString];
}

- (NSNumberFormatter *)numberFormatter {
    static NSNumberFormatter *kSharedFormatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        kSharedFormatter = [[NSNumberFormatter alloc] init];
        [kSharedFormatter setPositiveFormat:@"$0.00"];
    });
    return kSharedFormatter;
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
