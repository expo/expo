import PassKit
import Stripe

@objc(ABI40_0_0StripeSdk)
class StripeSdk: ABI40_0_0RCTEventEmitter, STPApplePayContextDelegate  {
    var merchantIdentifier: String? = nil
    
    var applePayCompletionCallback: STPIntentClientSecretCompletionBlock? = nil
    var applePayRequestResolver: ABI40_0_0RCTPromiseResolveBlock? = nil
    var applePayRequestRejecter: ABI40_0_0RCTPromiseRejectBlock? = nil
    var applePayCompletionRejecter: ABI40_0_0RCTPromiseRejectBlock? = nil
    var confirmApplePayPaymentResolver: ABI40_0_0RCTPromiseResolveBlock? = nil
    
    var shippingMethodUpdateHandler: ((PKPaymentRequestShippingMethodUpdate) -> Void)? = nil
    var shippingContactUpdateHandler: ((PKPaymentRequestShippingContactUpdate) -> Void)? = nil

    override func supportedEvents() -> [String]! {
      return ["onDidSetShippingMethod", "onDidSetShippingContact"]
    }
        
    @objc(ABI40_0_0initialise:appInfo:stripeAccountId:params:merchantIdentifier:)
    func initialise(publishableKey: String,  appInfo: NSDictionary, stripeAccountId: String?, params: NSDictionary?, merchantIdentifier: String?) -> Void {
        if let params = params {
            configure3dSecure(params)
        }
        STPAPIClient.shared.publishableKey = publishableKey
        STPAPIClient.shared.stripeAccount = stripeAccountId
        
        let name = ABI40_0_0RCTConvert.nsString(appInfo["name"]) ?? ""
        let partnerId = ABI40_0_0RCTConvert.nsString(appInfo["partnerId"]) ?? ""
        let version = ABI40_0_0RCTConvert.nsString(appInfo["version"]) ?? ""
        let url = ABI40_0_0RCTConvert.nsString(appInfo["url"]) ?? ""
        
        STPAPIClient.shared.appInfo = STPAppInfo(name: name, partnerId: partnerId, version: version, url: url)
        self.merchantIdentifier = merchantIdentifier
    }
    
    @objc(ABI40_0_0createTokenForCVCUpdate:resolver:rejecter:)
    func createTokenForCVCUpdate(cvc: String?, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock, rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        guard let cvc = cvc else {
            reject("Failed", "You must provide CVC", nil)
            return;
        }
        
        STPAPIClient.shared.createToken(forCVCUpdate: cvc) { (token, error) in
            if error != nil || token == nil {
                reject("Failed", error?.localizedDescription, nil)
            } else {
                let tokenId = token?.tokenId
                resolve(tokenId)
            }
        }
    }
    
    @objc(ABI40_0_0confirmSetupIntent:data:options:resolver:rejecter:)
    func confirmSetupIntent (setupIntentClientSecret: String, data: NSDictionary,
                             options: NSDictionary, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
                             rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        var billing: STPPaymentMethodBillingDetails? = nil
        if let billingDetails = data["billingDetails"] as? NSDictionary {
            billing = Mappers.mapToBillingDetails(billingDetails: billingDetails)
        }
        let cardParams = Mappers.mapCardParams(params: data["cardDetails"] as! NSDictionary)
        
        let paymentMethodParams = STPPaymentMethodParams(card: cardParams, billingDetails: billing, metadata: nil)
        let setupIntentParams = STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret)
        setupIntentParams.paymentMethodParams = paymentMethodParams
        
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.confirmSetupIntent(setupIntentParams, with: self) { status, setupIntent, error in
            switch (status) {
            case .failed:
                reject(ConfirmSetupIntentErrorType.Failed.rawValue, error?.localizedDescription ?? "", nil)
                break
            case .canceled:
                reject(ConfirmSetupIntentErrorType.Canceled.rawValue, error?.localizedDescription ?? "", nil)
                break
            case .succeeded:
                let intent = Mappers.mapFromSetupIntent(setupIntent: setupIntent!)
                resolve(intent)
            @unknown default:
                reject(ConfirmSetupIntentErrorType.Unknown.rawValue, error?.localizedDescription ?? "", nil)
                break
            }
        }
    }
    
    @objc(ABI40_0_0updateApplePaySummaryItems:resolver:rejecter:)
    func updateApplePaySummaryItems(summaryItems: NSArray, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock, rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        if (shippingMethodUpdateHandler == nil && shippingContactUpdateHandler == nil) {
            reject(ApplePayErrorType.Failed.rawValue, "You can use this method only after either onDidSetShippingMethod or onDidSetShippingContact events emitted", nil)
            return
        }
        var paymentSummaryItems: [PKPaymentSummaryItem] = []
        if let items = summaryItems as? [[String : Any]] {
            for item in items {
                let label = item["label"] as? String ?? ""
                let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
                let type = Mappers.mapToPaymentSummaryItemType(type: item["type"] as? String)
                paymentSummaryItems.append(PKPaymentSummaryItem(label: label, amount: amount, type: type))
            }
        }
        shippingMethodUpdateHandler?(PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: paymentSummaryItems))
        shippingContactUpdateHandler?(PKPaymentRequestShippingContactUpdate.init(paymentSummaryItems: paymentSummaryItems))
        self.shippingMethodUpdateHandler = nil
        self.shippingContactUpdateHandler = nil
        resolve(NSNull())
    }


    func applePayContext(_ context: STPApplePayContext, didSelect shippingMethod: PKShippingMethod, handler: @escaping (PKPaymentRequestShippingMethodUpdate) -> Void) {
        self.shippingMethodUpdateHandler = handler
        sendEvent(withName: "onDidSetShippingMethod", body: ["shippingMethod": Mappers.mapFromShippingMethod(shippingMethod: shippingMethod)])
    }
    
    func applePayContext(_ context: STPApplePayContext, didSelectShippingContact contact: PKContact, handler: @escaping (PKPaymentRequestShippingContactUpdate) -> Void) {
        self.shippingContactUpdateHandler = handler
        sendEvent(withName: "onDidSetShippingContact", body: ["shippingContact": Mappers.mapFromShippingContact(shippingContact: contact)])
    }
    
    func applePayContext(_ context: STPApplePayContext, didCreatePaymentMethod paymentMethod: STPPaymentMethod, paymentInformation: PKPayment, completion: @escaping STPIntentClientSecretCompletionBlock) {
        self.applePayCompletionCallback = completion
        self.applePayRequestResolver?([NSNull()])
    }
    
    @objc(ABI40_0_0confirmApplePayPayment:resolver:rejecter:)
    func confirmApplePayPayment(clientSecret: String, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock, rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        self.applePayCompletionRejecter = reject
        self.applePayCompletionCallback?(clientSecret, nil)
        self.confirmApplePayPaymentResolver = resolve
    }
    
    func applePayContext(_ context: STPApplePayContext, didCompleteWith status: STPPaymentStatus, error: Error?) {
        switch status {
        case .success:
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            confirmApplePayPaymentResolver?([NSNull()])
            break
        case .error:
            let message = "Apple pay completion failed"
            applePayCompletionRejecter?(ApplePayErrorType.Failed.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Failed.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        case .userCancellation:
            let message = "Apple pay payment has been cancelled"
            applePayCompletionRejecter?(ApplePayErrorType.Canceled.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Canceled.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        @unknown default:
            let message = "Cannot complete payment"
            applePayCompletionRejecter?(ApplePayErrorType.Unknown.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Unknown.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
        }
    }
    
    @objc(ABI40_0_0isApplePaySupported:rejecter:)
    func isApplePaySupported(resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
                             rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        let isSupported = StripeAPI.deviceSupportsApplePay()
        resolve([isSupported])
    }

    @objc(ABI40_0_0presentApplePay:resolver:rejecter:)
    func presentApplePay(params: NSDictionary,
                         resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
                         rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        if (merchantIdentifier == nil) {
            reject(ApplePayErrorType.Failed.rawValue, "You must provide merchantIdentifier", nil)
            return
        }
        
        guard let summaryItems = params["cartItems"] as? NSArray else {
            reject(ApplePayErrorType.Failed.rawValue, "You must provide the items for purchase", nil)
            return
        }
        guard let country = params["country"] as? String else {
            reject(ApplePayErrorType.Failed.rawValue, "You must provide the country", nil)
            return
        }
        guard let currency = params["currency"] as? String else {
            reject(ApplePayErrorType.Failed.rawValue, "You must provide the payment currency", nil)
            return
        }
        
        self.applePayRequestResolver = resolve
        self.applePayRequestRejecter = reject
        
        let merchantIdentifier = self.merchantIdentifier ?? ""
        let paymentRequest = StripeAPI.paymentRequest(withMerchantIdentifier: merchantIdentifier, country: country, currency: currency)
        
        let requiredShippingAddressFields = params["requiredShippingAddressFields"] as? NSArray ?? NSArray()
        let requiredBillingContactFields = params["requiredBillingContactFields"] as? NSArray ?? NSArray()
        let shippingMethods = params["shippingMethods"] as? NSArray ?? NSArray()
        
        paymentRequest.requiredShippingContactFields = Set(requiredShippingAddressFields.map {
            Mappers.mapToPKContactField(field: $0 as! String)
        })
        
        paymentRequest.requiredBillingContactFields = Set(requiredBillingContactFields.map {
            Mappers.mapToPKContactField(field: $0 as! String)
        })
        
        paymentRequest.shippingMethods = Mappers.mapToShippingMethods(shippingMethods: shippingMethods)
        
        var paymentSummaryItems: [PKPaymentSummaryItem] = []
        
        if let items = summaryItems as? [[String : Any]] {
            for item in items {
                let label = item["label"] as? String ?? ""
                let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
                let type = Mappers.mapToPaymentSummaryItemType(type: item["type"] as? String)
                paymentSummaryItems.append(PKPaymentSummaryItem(label: label, amount: amount, type: type))
            }
        }
        
        paymentRequest.paymentSummaryItems = paymentSummaryItems
        if let applePayContext = STPApplePayContext(paymentRequest: paymentRequest, delegate: self) {
            DispatchQueue.main.async {
                applePayContext.presentApplePay(on: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
            }
        } else {
            reject(ApplePayErrorType.Failed.rawValue, "Apple pay request failed", nil)
        }
    }
    
    func configure3dSecure(_ params: NSDictionary) {
        let threeDSCustomizationSettings = STPPaymentHandler.shared().threeDSCustomizationSettings
        let uiCustomization = Mappers.mapUICustomization(params)
        
        threeDSCustomizationSettings.uiCustomization = uiCustomization
    }
    
    @objc(ABI40_0_0createPaymentMethod:options:resolver:rejecter:)
    func createPaymentMethod(
        data: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ) -> Void {
        var billing: STPPaymentMethodBillingDetails? = nil
        if let billingDetails = data["billingDetails"] as! NSDictionary? {
            billing = Mappers.mapToBillingDetails(billingDetails: billingDetails)
        }
        let paymentMethodParams = Mappers.mapCardParamsToPaymentMethodParams(params: data["cardDetails"] as! NSDictionary, billingDetails: billing)
        STPAPIClient.shared.createPaymentMethod(with: paymentMethodParams) { paymentMethod, error in
            if let createError = error {
                reject(NextPaymentActionErrorType.Failed.rawValue, createError.localizedDescription, nil)
            }
            
            if let paymentMethod = paymentMethod {
                let method = Mappers.mapFromPaymentMethod(paymentMethod)
                resolve(method)
            }
        }
    }
    
    @objc(ABI40_0_0handleCardAction:resolver:rejecter:)
    func handleCardAction(
        paymentIntentClientSecret: String,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ){
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.handleNextAction(forPayment: paymentIntentClientSecret, with: self, returnURL: nil) { status, paymentIntent, handleActionError in
            switch (status) {
            case .failed:
                reject(NextPaymentActionErrorType.Failed.rawValue, handleActionError?.localizedDescription ?? "", nil)
                break
            case .canceled:
                reject(NextPaymentActionErrorType.Canceled.rawValue, handleActionError?.localizedDescription ?? "", nil)
                break
            case .succeeded:
                if let paymentIntent = paymentIntent {
                    resolve(Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent))
                }
                break
            @unknown default:
                reject(NextPaymentActionErrorType.Unknown.rawValue, "Cannot complete payment", nil)
                break
            }
        }
    }
    
    @objc(ABI40_0_0confirmPaymentMethod:data:options:resolver:rejecter:)
    func confirmPaymentMethod(
        paymentIntentClientSecret: String,
        data: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ) -> Void {
        let paymentMethodId = data["paymentMethodId"] as? String
        let paymentIntentParams = STPPaymentIntentParams(clientSecret: paymentIntentClientSecret)
        if let setupFutureUsage = data["setupFutureUsage"] as? String {
            paymentIntentParams.setupFutureUsage = Mappers.mapToPaymentIntentFutureUsage(usage: setupFutureUsage)
        }
        
        var billingDetails: STPPaymentMethodBillingDetails? = nil
        if let billing = data["billingDetails"] as? NSDictionary {
            billingDetails = Mappers.mapToBillingDetails(billingDetails: billing)
        }
        
        if let cvc = data["cvc"] as? String {
            let cardOptions = STPConfirmCardOptions()
            cardOptions.cvc = cvc;
            let paymentMethodOptions = STPConfirmPaymentMethodOptions()
            paymentMethodOptions.cardOptions = cardOptions
            paymentIntentParams.paymentMethodOptions = paymentMethodOptions
        } else if paymentMethodId != nil {
            paymentIntentParams.paymentMethodId = paymentMethodId
        } else {
            guard let cardDetails = data["cardDetails"] as? NSDictionary else {
                let message = "To confirm the payment you must provide card details or paymentMethodId"
                reject(ConfirmPaymentErrorType.Failed.rawValue, message, nil)
                return
            }
            let paymentMethodParams = Mappers.mapCardParamsToPaymentMethodParams(params: cardDetails, billingDetails: billingDetails)
            paymentIntentParams.paymentMethodParams = paymentMethodParams
        }
        
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.confirmPayment(paymentIntentParams, with: self) { (status, paymentIntent, error) in
            switch (status) {
            case .failed:
                reject(ConfirmPaymentErrorType.Failed.rawValue, error?.localizedDescription ?? "", nil)
                break
            case .canceled:
                reject(ConfirmPaymentErrorType.Canceled.rawValue, error?.localizedDescription ?? "", nil)
                break
            case .succeeded:
                if let paymentIntent = paymentIntent {
                    let intent = Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)
                    resolve(intent)
                }
                break
            @unknown default:
                reject(ConfirmPaymentErrorType.Unknown.rawValue, "Cannot complete payment", nil)
                break
            }
        }
        
    }
    
    @objc(ABI40_0_0retrievePaymentIntent:resolver:rejecter:)
    func retrievePaymentIntent(
        clientSecret: String,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ) -> Void {
        STPAPIClient.shared.retrievePaymentIntent(withClientSecret: clientSecret) { (paymentIntent, error) in
            guard error == nil else {
                reject(RetrievePaymentIntentErrorType.Unknown.rawValue, error?.localizedDescription, nil)
                return
            }
            
            if let paymentIntent = paymentIntent {
                resolve(Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent))
            } else {
                reject(RetrievePaymentIntentErrorType.Unknown.rawValue, "Cannot retrieve PaymentIntent", nil)
            }
        }
    }
    
}

extension StripeSdk: STPAuthenticationContext {
    func authenticationPresentingViewController() -> UIViewController {
        if let topViewController = UIApplication.shared.delegate?.window??.rootViewController {
            return topViewController
        }
        return UIViewController()
    }
}
