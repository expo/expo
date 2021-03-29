import PassKit
import Stripe

@objc(ABI40_0_0StripeSdk)
class StripeSdk: ABI40_0_0RCTEventEmitter, STPApplePayContextDelegate  {
    var merchantIdentifier: String? = nil
    var urlScheme: String? = nil
    
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

    @objc override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(ABI40_0_0initialise:)
    func initialise(params: NSDictionary) -> Void {
        let publishableKey = params["publishableKey"] as! String
        let appInfo = params["appInfo"] as! NSDictionary
        let stripeAccountId = params["stripeAccountId"] as? String
        let params3ds = params["threeDSecureParams"] as? NSDictionary
        let urlScheme = params["urlScheme"] as? String
        let merchantIdentifier = params["merchantIdentifier"] as? String
        
        if let params3ds = params3ds {
            configure3dSecure(params3ds)
        }

        self.urlScheme = urlScheme

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
    func confirmSetupIntent (setupIntentClientSecret: String, params: NSDictionary,
                             options: NSDictionary, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
                             rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            reject(ConfirmPaymentErrorType.Failed.rawValue, "You must provide paymentMethodType", nil)
            return
        }
                
        var paymentMethodParams: STPPaymentMethodParams?
        let factory = PaymentMethodFactory.init(params: params)
        
        do {
            paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
        } catch  {
            reject(ConfirmPaymentErrorType.Failed.rawValue, error.localizedDescription, nil)
        }
        guard paymentMethodParams != nil else {
            reject(ConfirmPaymentErrorType.Unknown.rawValue, "Unhandled error occured", nil)
            return
        }
        
        let setupIntentParams = STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret)
        setupIntentParams.paymentMethodParams = paymentMethodParams

        if let urlScheme = urlScheme {
            setupIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme, paymentType: paymentMethodType)
        }
        
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
  
    @objc(ABI40_0_0handleURLCallback:resolver:rejecter:)
    func handleURLCallback(url: String?, resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock, rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock) {
      guard let url = url else {
        resolve(false)
        return;
      }
      let urlObj = URL(string: url)
      if (urlObj == nil) {
        resolve(false)
      } else {
        DispatchQueue.main.async {
          let stripeHandled = StripeAPI.handleURLCallback(with: urlObj!)
          resolve(stripeHandled)
        }
      }
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
        params: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ) -> Void {
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            reject(NextPaymentActionErrorType.Failed.rawValue, "You must provide paymentMethodType", nil)
            return
        }
        
        var paymentMethodParams: STPPaymentMethodParams?
        let factory = PaymentMethodFactory.init(params: params)
        
        do {
            paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
        } catch  {
            reject(NextPaymentActionErrorType.Failed.rawValue, error.localizedDescription, nil)
        }
        
        guard let params = paymentMethodParams else {
            reject(NextPaymentActionErrorType.Unknown.rawValue, "Unhandled error occured", nil)
            return
        }
        
        STPAPIClient.shared.createPaymentMethod(with: params) { paymentMethod, error in
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
        params: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping ABI40_0_0RCTPromiseResolveBlock,
        rejecter reject: @escaping ABI40_0_0RCTPromiseRejectBlock
    ) -> Void {
        let paymentMethodId = params["paymentMethodId"] as? String
        let paymentIntentParams = STPPaymentIntentParams(clientSecret: paymentIntentClientSecret)
        if let setupFutureUsage = params["setupFutureUsage"] as? String {
            paymentIntentParams.setupFutureUsage = Mappers.mapToPaymentIntentFutureUsage(usage: setupFutureUsage)
        }
        
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            reject(ConfirmPaymentErrorType.Failed.rawValue, "You must provide paymentMethodType", nil)
            return
        }
                
        let cvc = params["cvc"] as? String
        
        if paymentMethodId != nil {
            paymentIntentParams.paymentMethodId = paymentMethodId
        } else if type == STPPaymentMethodType.card && cvc != nil {
            let cardOptions = STPConfirmCardOptions()
            cardOptions.cvc = cvc;
            let paymentMethodOptions = STPConfirmPaymentMethodOptions()
            paymentMethodOptions.cardOptions = cardOptions
            paymentIntentParams.paymentMethodOptions = paymentMethodOptions
        } else {
            var paymentMethodParams: STPPaymentMethodParams?
            var paymentMethodOptions: STPConfirmPaymentMethodOptions?
            let factory = PaymentMethodFactory.init(params: params)
            
            do {
                paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
                paymentMethodOptions = try factory.createOptions(paymentMethodType: paymentMethodType)
            } catch  {
                reject(ConfirmPaymentErrorType.Failed.rawValue, error.localizedDescription, nil)
            }
            guard paymentMethodParams != nil else {
                reject(ConfirmPaymentErrorType.Unknown.rawValue, "Unhandled error occured", nil)
                return
            }
            paymentIntentParams.paymentMethodParams = paymentMethodParams
            paymentIntentParams.paymentMethodOptions = paymentMethodOptions
            
            if let urlScheme = urlScheme {
                paymentIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme, paymentType: paymentMethodType)
            }
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
