//
//  ABI20_0_0TPSStripeManager.m
//  ABI20_0_0TPSStripe
//
//  Created by Anton Petrov on 28.10.16.
//  Copyright © 2016 Tipsi. All rights reserved.
//

#import "ABI20_0_0TPSStripeManager.h"
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>

@implementation ABI20_0_0RCTConvert (STPBankAccountHolderType)

ABI20_0_0RCT_ENUM_CONVERTER(STPBankAccountHolderType,
                   (@{
                      @"individual": @(STPBankAccountHolderTypeIndividual),
                      @"company": @(STPBankAccountHolderTypeCompany),
                      }),
                   STPBankAccountHolderTypeCompany,
                   integerValue)

+ (NSString *)STPBankAccountHolderTypeString:(STPBankAccountHolderType)type {
    NSString *string = nil;
    switch (type) {
        case STPBankAccountHolderTypeCompany: {
            string = @"company";
        }
            break;
        case STPBankAccountHolderTypeIndividual:
        default: {
            string = @"individual";
        }
            break;
    }
    return string;
}

@end

@implementation ABI20_0_0RCTConvert (STPBankAccountStatus)

ABI20_0_0RCT_ENUM_CONVERTER(STPBankAccountStatus,
                   (@{
                      @"new": @(STPBankAccountStatusNew),
                      @"validated": @(STPBankAccountStatusValidated),
                      @"verified": @(STPBankAccountStatusVerified),
                      @"errored": @(STPBankAccountStatusErrored),
                      }),
                   STPBankAccountStatusNew,
                   integerValue)

+ (NSString *)STPBankAccountStatusString:(STPBankAccountStatus)status {
    NSString *string = nil;
    switch (status) {
        case STPBankAccountStatusValidated: {
            string = @"validated";
        }
            break;
        case STPBankAccountStatusVerified: {
            string = @"verified";
        }
            break;
        case STPBankAccountStatusErrored: {
            string = @"errored";
        }
            break;
        case STPBankAccountStatusNew:
        default: {
            string = @"new";
        }
            break;
    }
    return string;
}

@end

@implementation ABI20_0_0TPSStripeManager
{
    NSString *publishableKey;
    NSString *merchantId;

    ABI20_0_0RCTPromiseResolveBlock promiseResolver;
    ABI20_0_0RCTPromiseRejectBlock promiseRejector;

    BOOL requestIsCompleted;

    void (^applePayCompletion)(PKPaymentAuthorizationStatus);
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

ABI20_0_0RCT_EXPORT_MODULE();

ABI20_0_0RCT_EXPORT_METHOD(initialize:(NSDictionary *)options) {
    publishableKey = options[@"publishableKey"];
    if (options[@"merchantId"] != NULL) {
      merchantId = options[@"merchantId"];
    } else {
      merchantId = @"merchant.client";
    }
    [Stripe setDefaultPublishableKey:publishableKey];
}

ABI20_0_0RCT_EXPORT_METHOD(deviceSupportsApplePayAsync:(ABI20_0_0RCTPromiseResolveBlock)resolve
                                rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    resolve(@([Stripe deviceSupportsApplePay]));
}

ABI20_0_0RCT_EXPORT_METHOD(completeApplePayRequestAsync:(ABI20_0_0RCTPromiseResolveBlock)resolve
                                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if (applePayCompletion) {
        applePayCompletion(PKPaymentAuthorizationStatusSuccess);
    }
    resolve(nil);
}

ABI20_0_0RCT_EXPORT_METHOD(cancelApplePayRequestAsync:(ABI20_0_0RCTPromiseResolveBlock)resolve
                               rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if (applePayCompletion) {
        applePayCompletion(PKPaymentAuthorizationStatusFailure);
    }
    resolve(nil);
}

ABI20_0_0RCT_EXPORT_METHOD(createTokenWithCardAsync:(NSDictionary *)params
                             resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        reject(
            [NSString stringWithFormat:@"%ld", (long)3],
            @"Previous request is not completed",
            [[NSError alloc] initWithDomain:@"StripeNative" code:3 userInfo:@{NSLocalizedDescriptionKey:@"Previous request is not completed"}]
        );
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

    [[STPAPIClient sharedClient] createTokenWithCard:cardParams completion:^(STPToken *token, NSError *error) {
        requestIsCompleted = YES;

        if (error) {
            reject(nil, nil, error);
        } else {
            resolve([self convertTokenObject:token]);
        }
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(createTokenWithBankAccountAsync:(NSDictionary *)params
                  resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        reject(
               [NSString stringWithFormat:@"%ld", (long)3],
               @"Previous request is not completed",
               [[NSError alloc] initWithDomain:@"StripeNative" code:3 userInfo:@{NSLocalizedDescriptionKey:@"Previous request is not completed"}]
               );
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
    [ABI20_0_0RCTConvert STPBankAccountHolderType:params[@"accountHolderType"]];
    [bankAccount setAccountHolderType: accountHolderType];
    
    [[STPAPIClient sharedClient] createTokenWithBankAccount:bankAccount completion:^(STPToken *token, NSError *error) {
        requestIsCompleted = YES;
        
        if (error) {
            reject(nil, nil, error);
        } else {
            resolve([self convertTokenObject:token]);
        }
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(paymentRequestWithCardFormAsync:(NSDictionary *)options
                                    resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                                    rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        reject(
            [NSString stringWithFormat:@"%ld", (long)3],
            @"Previous request is not completed",
            [[NSError alloc] initWithDomain:@"StripeNative" code:3 userInfo:@{NSLocalizedDescriptionKey:@"Previous request is not completed"}]
        );
        return;
    }

    requestIsCompleted = NO;
    // Save promise handlers to use in `paymentAuthorizationViewController`
    promiseResolver = resolve;
    promiseRejector = reject;

    NSUInteger requiredBillingAddressFields = [self billingType:options[@"requiredBillingAddressFields"]];
    NSString *companyName = options[@"companyName"] ? options[@"companyName"] : @"";
    BOOL smsAutofillDisabled = [options[@"smsAutofillDisabled"] boolValue];
    STPUserInformation *prefilledInformation = [self userInformation:options[@"prefilledInformation"]];
    NSString *managedAccountCurrency = options[@"managedAccountCurrency"];
    NSString *nextPublishableKey = options[@"publishableKey"] ? options[@"publishableKey"] : publishableKey;
    UIModalPresentationStyle formPresentation = [self formPresentation:options[@"presentation"]];
    STPTheme *theme = [self formTheme:options[@"theme"]];

    STPPaymentConfiguration *configuration = [[STPPaymentConfiguration alloc] init];
    [configuration setRequiredBillingAddressFields:requiredBillingAddressFields];
    [configuration setCompanyName:companyName];
    [configuration setSmsAutofillDisabled:smsAutofillDisabled];
    [configuration setPublishableKey:nextPublishableKey];


    STPAddCardViewController *addCardViewController = [[STPAddCardViewController alloc] initWithConfiguration:configuration theme:theme];
    [addCardViewController setDelegate:self];
    [addCardViewController setPrefilledInformation:prefilledInformation];
    [addCardViewController setManagedAccountCurrency:managedAccountCurrency];
    // STPAddCardViewController must be shown inside a UINavigationController.
    UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:addCardViewController];
    [navigationController setModalPresentationStyle:formPresentation];
    [ABI20_0_0RCTPresentedViewController() presentViewController:navigationController animated:YES completion:nil];
}

ABI20_0_0RCT_EXPORT_METHOD(paymentRequestWithApplePayAsync:(NSArray *)items
                                 withOptions:(NSDictionary *)options
                                    resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                                    rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject) {
    if(!requestIsCompleted) {
        reject(
           [NSString stringWithFormat:@"%ld", (long)3],
           @"Previous request is not completed",
           [[NSError alloc] initWithDomain:@"StripeNative" code:3 userInfo:@{NSLocalizedDescriptionKey:@"Previous request is not completed"}]
        );
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
        [summaryItems addObject:summaryItem];
    }

    PKPaymentRequest *paymentRequest = [Stripe paymentRequestWithMerchantIdentifier:merchantId];

    [paymentRequest setRequiredShippingAddressFields:requiredShippingAddressFields];
    [paymentRequest setRequiredBillingAddressFields:requiredBillingAddressFields];
    [paymentRequest setPaymentSummaryItems:summaryItems];
    [paymentRequest setShippingMethods:shippingMethods];
    [paymentRequest setShippingType:shippingType];
    [paymentRequest setCurrencyCode:currencyCode];

    if ([Stripe canSubmitPaymentRequest:paymentRequest]) {
        PKPaymentAuthorizationViewController *paymentAuthorizationVC = [[PKPaymentAuthorizationViewController alloc] initWithPaymentRequest:paymentRequest];
        paymentAuthorizationVC.delegate = self;
        [ABI20_0_0RCTPresentedViewController() presentViewController:paymentAuthorizationVC animated:YES completion:nil];
    } else {
        // There is a problem with your Apple Pay configuration.
        promiseRejector = nil;
        promiseResolver = nil;
        requestIsCompleted = YES;
        reject(
            [NSString stringWithFormat:@"%ld", (long)1],
            @"Apple Pay configuration error",
            [NSError errorWithDomain:@"StipeNative" code:1 userInfo:@{NSLocalizedDescriptionKey:@"Apple Pay configuration error"}]
        );
    }
}

ABI20_0_0RCT_EXPORT_METHOD(openApplePaySetup) {
    PKPassLibrary *library = [[PKPassLibrary alloc] init];

    // Here we should check, if openPaymentSetup selector exist
    if ([library respondsToSelector:NSSelectorFromString(@"openPaymentSetup")]) {
        [library openPaymentSetup];
    }
}

#pragma mark STPAddCardViewControllerDelegate

- (void)addCardViewController:(STPAddCardViewController *)controller
               didCreateToken:(STPToken *)token
                   completion:(STPErrorBlock)completion {
    [ABI20_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];

    requestIsCompleted = YES;
    completion(nil);
    promiseResolver([self convertTokenObject:token]);
}

- (void)addCardViewControllerDidCancel:(STPAddCardViewController *)addCardViewController {
    [ABI20_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];

    if (!requestIsCompleted) {
        requestIsCompleted = YES;
        promiseRejector(
            [NSString stringWithFormat:@"%ld", (long)2],
            @"User canceled payment via card",
            [[NSError alloc] initWithDomain:@"StripeNative" code:2 userInfo:@{NSLocalizedDescriptionKey:@"User canceled payment via card"}]
        );
    }

}

#pragma mark PKPaymentAuthorizationViewControllerDelegate

- (void)paymentAuthorizationViewController:(PKPaymentAuthorizationViewController *)controller
                       didAuthorizePayment:(PKPayment *)payment
                                completion:(void (^)(PKPaymentAuthorizationStatus))completion {
    // Save for deffered call
    applePayCompletion = completion;

    [[STPAPIClient sharedClient] createTokenWithPayment:payment completion:^(STPToken * _Nullable token, NSError * _Nullable error) {
        requestIsCompleted = YES;

        if (error) {
            completion(PKPaymentAuthorizationStatusFailure);
            promiseRejector(nil, nil, error);
        } else {
            NSDictionary *result = [self convertTokenObject:token];
            NSDictionary *extra = @{
                @"billingContact": [self contactDetails:payment.billingContact] ?: [NSNull null],
                @"shippingContact": [self contactDetails:payment.shippingContact] ?: [NSNull null],
                @"shippingMethod": [self shippingDetails:payment.shippingMethod] ?: [NSNull null]
            };

            [result setValue:extra forKey:@"extra"];

            promiseResolver(result);
        }
    }];
}


- (void)paymentAuthorizationViewControllerDidFinish:(PKPaymentAuthorizationViewController *)controller {
    [ABI20_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];

    if (!requestIsCompleted) {
        requestIsCompleted = YES;
        promiseRejector(
            [NSString stringWithFormat:@"%ld", (long)2],
            @"User canceled Apple Pay",
            [[NSError alloc] initWithDomain:@"StripeNative" code:2 userInfo:@{NSLocalizedDescriptionKey:@"User canceled Apple Pay"}]
        );
    }
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

        [card setValue:token.card.cardId forKey:@"cardId"];

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
        [card setValue:token.card.addressLine1 forKey:@"addressLine1"];
        [card setValue:token.card.addressLine2 forKey:@"addressLine2"];
        [card setValue:token.card.addressCity forKey:@"addressCity"];
        [card setValue:token.card.addressState forKey:@"addressState"];
        [card setValue:token.card.addressCountry forKey:@"addressCountry"];
        [card setValue:token.card.addressZip forKey:@"addressZip"];
    }

    // Bank Account
    if (token.bankAccount) {
        NSMutableDictionary *bankAccount = [@{} mutableCopy];
        [result setValue:bankAccount forKey:@"bankAccount"];

        NSString *bankAccountStatusString =
        [ABI20_0_0RCTConvert STPBankAccountStatusString:token.bankAccount.status];
        [bankAccount setValue:bankAccountStatusString forKey:@"status"];
        [bankAccount setValue:token.bankAccount.country forKey:@"countryCode"];
        [bankAccount setValue:token.bankAccount.currency forKey:@"currency"];
        [bankAccount setValue:token.bankAccount.bankAccountId forKey:@"bankAccountId"];
        [bankAccount setValue:token.bankAccount.bankName forKey:@"bankName"];
        [bankAccount setValue:token.bankAccount.last4 forKey:@"last4"];
        [bankAccount setValue:token.bankAccount.accountHolderName forKey:@"accountHolderName"];
        NSString *bankAccountHolderTypeString =
        [ABI20_0_0RCTConvert STPBankAccountHolderTypeString:token.bankAccount.accountHolderType];
        [bankAccount setValue:bankAccountHolderTypeString forKey:@"accountHolderType"];
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
        case STPCardBrandUnknown:
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

- (PKAddressField)applePayAddressFields:(NSString*)inputType {
    PKAddressField addressField = PKAddressFieldNone;
    if ([inputType isEqualToString:@"postal_address"]) {
        addressField = PKAddressFieldPostalAddress;
    }
    if ([inputType isEqualToString:@"phone"]) {
        addressField = PKAddressFieldPhone;
    }
    if ([inputType isEqualToString:@"email"]) {
        addressField = PKAddressFieldEmail;
    }
    if ([inputType isEqualToString:@"name"]) {
        addressField = PKAddressFieldName;
    }
    if ([inputType isEqualToString:@"all"]) {
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

    [userInformation setEmail:inputInformation[@"email"]];
    [userInformation setPhone:inputInformation[@"phone"]];
    [userInformation setBillingAddress: [self address:inputInformation[@"billingAddress"]]];

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

    [theme setPrimaryBackgroundColor:[ABI20_0_0RCTConvert UIColor:options[@"primaryBackgroundColor"]]];
    [theme setSecondaryBackgroundColor:[ABI20_0_0RCTConvert UIColor:options[@"secondaryBackgroundColor"]]];
    [theme setPrimaryForegroundColor:[ABI20_0_0RCTConvert UIColor:options[@"primaryForegroundColor"]]];
    [theme setSecondaryForegroundColor:[ABI20_0_0RCTConvert UIColor:options[@"secondaryForegroundColor"]]];
    [theme setAccentColor:[ABI20_0_0RCTConvert UIColor:options[@"accentColor"]]];
    [theme setErrorColor:[ABI20_0_0RCTConvert UIColor:options[@"errorColor"]]];
    [theme setErrorColor:[ABI20_0_0RCTConvert UIColor:options[@"errorColor"]]];
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

- (NSNumberFormatter *)numberFormatter {
    static NSNumberFormatter *kSharedFormatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        kSharedFormatter = [[NSNumberFormatter alloc] init];
        [kSharedFormatter setPositiveFormat:@"$0.00"];
    });
    return kSharedFormatter;
}

@end
