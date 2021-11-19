import PassKit
import Stripe

@objc(StripeSdk)
class StripeSdk: RCTEventEmitter, STPApplePayContextDelegate, STPBankSelectionViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
    public var cardFieldView: CardFieldView? = nil
    public var cardFormView: CardFormView? = nil

    var merchantIdentifier: String? = nil
    
    private var paymentSheet: PaymentSheet?
    private var paymentSheetFlowController: PaymentSheet.FlowController?
    
    var urlScheme: String? = nil

    var applePayCompletionCallback: STPIntentClientSecretCompletionBlock? = nil
    var applePayRequestResolver: RCTPromiseResolveBlock? = nil
    var applePayRequestRejecter: RCTPromiseRejectBlock? = nil
    var applePayCompletionRejecter: RCTPromiseRejectBlock? = nil
    var confirmApplePayPaymentResolver: RCTPromiseResolveBlock? = nil
    var confirmPaymentResolver: RCTPromiseResolveBlock? = nil
    
    var confirmPaymentClientSecret: String? = nil
    
    var shippingMethodUpdateHandler: ((PKPaymentRequestShippingMethodUpdate) -> Void)? = nil
    var shippingContactUpdateHandler: ((PKPaymentRequestShippingContactUpdate) -> Void)? = nil
    
    override func supportedEvents() -> [String]! {
        return ["onDidSetShippingMethod", "onDidSetShippingContact"]
    }
    
    @objc override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc(initialise:resolver:rejecter:)
    func initialise(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
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
        
        let name = RCTConvert.nsString(appInfo["name"]) ?? ""
        let partnerId = RCTConvert.nsString(appInfo["partnerId"]) ?? ""
        let version = RCTConvert.nsString(appInfo["version"]) ?? ""
        let url = RCTConvert.nsString(appInfo["url"]) ?? ""
        
        STPAPIClient.shared.appInfo = STPAppInfo(name: name, partnerId: partnerId, version: version, url: url)
        self.merchantIdentifier = merchantIdentifier
        resolve(NSNull())
    }

    @objc(initPaymentSheet:resolver:rejecter:)
    func initPaymentSheet(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) -> Void  {
        var configuration = PaymentSheet.Configuration()
        
        if  params["applePay"] as? Bool == true {
            if let merchantIdentifier = self.merchantIdentifier, let merchantCountryCode = params["merchantCountryCode"] as? String {
                configuration.applePay = .init(merchantId: merchantIdentifier,
                                               merchantCountryCode: merchantCountryCode)
            } else {
                resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "Either merchantIdentifier or merchantCountryCode is missing"))
                return
            }
        }
        
        if let merchantDisplayName = params["merchantDisplayName"] as? String {
            configuration.merchantDisplayName = merchantDisplayName
        }
        
        if let customerId = params["customerId"] as? String {
            if let customerEphemeralKeySecret = params["customerEphemeralKeySecret"] as? String {
                if (!Errors.isEKClientSecretValid(clientSecret: customerEphemeralKeySecret)) {
                    resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "`customerEphemeralKeySecret` format does not match expected client secret formatting."))
                    return
                }
                configuration.customer = .init(id: customerId, ephemeralKeySecret: customerEphemeralKeySecret)
            }
        }
        
        if #available(iOS 13.0, *) {
            if let style = params["style"] as? String {
                configuration.style = Mappers.mapToUserInterfaceStyle(style)
            }
        }
        
        func handlePaymentSheetFlowControllerResult(result: Result<PaymentSheet.FlowController, Error>, stripeSdk: StripeSdk?) {
            switch result {
            case .failure(let error):
                resolve(Errors.createError("Failed", error as NSError))
            case .success(let paymentSheetFlowController):
                self.paymentSheetFlowController = paymentSheetFlowController
                if let paymentOption = stripeSdk?.paymentSheetFlowController?.paymentOption {
                    let option: NSDictionary = [
                        "label": paymentOption.label,
                        "image": paymentOption.image.pngData()?.base64EncodedString() ?? ""
                    ]
                    resolve(Mappers.createResult("paymentOption", option))
                } else {
                    resolve(Mappers.createResult("paymentOption", nil))
                }
            }
        }
        
        if let paymentIntentClientSecret = params["paymentIntentClientSecret"] as? String {
            if (!Errors.isPIClientSecretValid(clientSecret: paymentIntentClientSecret)) {
                resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "`secret` format does not match expected client secret formatting."))
                return
            }
            
            if params["customFlow"] as? Bool == true {
                PaymentSheet.FlowController.create(paymentIntentClientSecret: paymentIntentClientSecret,
                                                   configuration: configuration) { [weak self] result in
                    handlePaymentSheetFlowControllerResult(result: result, stripeSdk: self)
                }
            } else {
                self.paymentSheet = PaymentSheet(paymentIntentClientSecret: paymentIntentClientSecret, configuration: configuration)
                resolve([])
            }
        } else if let setupIntentClientSecret = params["setupIntentClientSecret"] as? String {
            if (!Errors.isSetiClientSecretValid(clientSecret: setupIntentClientSecret)) {
                resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "`secret` format does not match expected client secret formatting."))
                return
            }
            
            if params["customFlow"] as? Bool == true {
                PaymentSheet.FlowController.create(setupIntentClientSecret: setupIntentClientSecret,
                                                   configuration: configuration) { [weak self] result in
                    handlePaymentSheetFlowControllerResult(result: result, stripeSdk: self)
                }
            } else {
                self.paymentSheet = PaymentSheet(setupIntentClientSecret: setupIntentClientSecret, configuration: configuration)
                resolve([])
            }
        } else {
            resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "You must provide either paymentIntentClientSecret or setupIntentClientSecret"))
        }
        
    }

    @objc(confirmPaymentSheetPayment:rejecter:)
    func confirmPaymentSheetPayment(resolver resolve: @escaping RCTPromiseResolveBlock,
                                    rejecter reject: @escaping RCTPromiseRejectBlock) -> Void  {
        DispatchQueue.main.async {
            if (self.paymentSheetFlowController != nil) {
                self.paymentSheetFlowController?.confirm(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController()) { paymentResult in
                    switch paymentResult {
                    case .completed:
                        resolve([])
                        self.paymentSheetFlowController = nil
                    case .canceled:
                        resolve(Errors.createError(PaymentSheetErrorType.Canceled.rawValue, "The payment has been canceled"))
                    case .failed(let error):
                        resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, error.localizedDescription))
                    }
                   
                }
            } else {
                resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "No payment sheet has been initialized yet"))
            }
        }
    }
    
    @objc(presentPaymentSheet:rejecter:)
    func presentPaymentSheet(resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) -> Void  {
        
        DispatchQueue.main.async {
            if let paymentSheetFlowController = self.paymentSheetFlowController {
                paymentSheetFlowController.presentPaymentOptions(from:
                    findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
                ) {
                    if let paymentOption = self.paymentSheetFlowController?.paymentOption {
                        let option: NSDictionary = [
                            "label": paymentOption.label,
                            "image": paymentOption.image.pngData()?.base64EncodedString() ?? ""
                        ]
                        resolve(Mappers.createResult("paymentOption", option))
                    } else {
                        resolve(Mappers.createResult("paymentOption", nil))
                    }
                }
            } else if let paymentSheet = self.paymentSheet {
                paymentSheet.present(from:
                    findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
                ) { paymentResult in
                    switch paymentResult {
                    case .completed:
                        resolve([])
                        self.paymentSheet = nil
                    case .canceled:
                        resolve(Errors.createError(PaymentSheetErrorType.Canceled.rawValue, "The payment has been canceled"))
                    case .failed(let error):
                        resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, error as NSError))
                    }
                }
            } else {
                resolve(Errors.createError(PaymentSheetErrorType.Failed.rawValue, "No payment sheet has been initialized yet"))
            }
        }
    }
    
    @objc(createTokenForCVCUpdate:resolver:rejecter:)
    func createTokenForCVCUpdate(cvc: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cvc = cvc else {
            resolve(Errors.createError("Failed", "You must provide CVC"))
            return;
        }
        
        STPAPIClient.shared.createToken(forCVCUpdate: cvc) { (token, error) in
            if error != nil || token == nil {
                resolve(Errors.createError("Failed", error?.localizedDescription ?? ""))
            } else {
                let tokenId = token?.tokenId
                resolve(["tokenId": tokenId])
            }
        }
    }
    
    @objc(confirmSetupIntent:data:options:resolver:rejecter:)
    func confirmSetupIntent (setupIntentClientSecret: String, params: NSDictionary,
                             options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, "You must provide paymentMethodType"))
            return
        }
        var paymentMethodParams: STPPaymentMethodParams?
        let factory = PaymentMethodFactory.init(params: params, cardFieldView: cardFieldView, cardFormView: cardFormView)
        
        do {
            paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
        } catch  {
            resolve(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, error.localizedDescription))
            return
        }
        guard paymentMethodParams != nil else {
            resolve(Errors.createError(ConfirmPaymentErrorType.Unknown.rawValue, "Unhandled error occured"))
            return
        }
        
        let setupIntentParams = STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret)
        setupIntentParams.paymentMethodParams = paymentMethodParams
        
        if let urlScheme = urlScheme {
            setupIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme)
        }
        
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.confirmSetupIntent(setupIntentParams, with: self) { status, setupIntent, error in
            switch (status) {
            case .failed:
                resolve(Errors.createError(ConfirmSetupIntentErrorType.Failed.rawValue, error))
                break
            case .canceled:
                if let lastError = setupIntent?.lastSetupError {
                    resolve(Errors.createError(ConfirmSetupIntentErrorType.Canceled.rawValue, lastError))
                } else {
                    resolve(Errors.createError(ConfirmSetupIntentErrorType.Canceled.rawValue, "The payment has been canceled"))
                }
                break
            case .succeeded:
                let intent = Mappers.mapFromSetupIntent(setupIntent: setupIntent!)
                resolve(Mappers.createResult("setupIntent", intent))
            @unknown default:
                resolve(Errors.createError(ConfirmSetupIntentErrorType.Unknown.rawValue, error))
                break
            }
        }
    }
    
    @objc(updateApplePaySummaryItems:errorAddressFields:resolver:rejecter:)
    func updateApplePaySummaryItems(summaryItems: NSArray, errorAddressFields: [NSDictionary], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if (shippingMethodUpdateHandler == nil && shippingContactUpdateHandler == nil) {
            resolve(Errors.createError(ApplePayErrorType.Failed.rawValue, "You can use this method only after either onDidSetShippingMethod or onDidSetShippingContact events emitted"))
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
        var shippingAddressErrors: [Error] = []

        for item in errorAddressFields {
            let field = item["field"] as! String
            let message = item["message"] as? String ?? field + " error"
            shippingAddressErrors.append(PKPaymentRequest.paymentShippingAddressInvalidError(withKey: field, localizedDescription: message))
        }

        shippingMethodUpdateHandler?(PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: paymentSummaryItems))
        shippingContactUpdateHandler?(PKPaymentRequestShippingContactUpdate.init(errors: shippingAddressErrors, paymentSummaryItems: paymentSummaryItems, shippingMethods: []))
        self.shippingMethodUpdateHandler = nil
        self.shippingContactUpdateHandler = nil
        resolve([])
    }
    
    @objc(openApplePaySetup:rejecter:)
    func openApplePaySetup(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let library = PKPassLibrary.init()
        if (library.responds(to: #selector(PKPassLibrary.openPaymentSetup))) {
            library.openPaymentSetup()
            resolve([])
        } else {
            resolve(Errors.createError("Failed", "Cannot open payment setup"))
        }
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
        
        let address = paymentMethod.billingDetails?.address?.line1?.split(whereSeparator: \.isNewline)
        if (address?.indices.contains(0) == true) {
            paymentMethod.billingDetails?.address?.line1 = String(address?[0] ?? "")
        }
        if (address?.indices.contains(1) == true) {
            paymentMethod.billingDetails?.address?.line2 = String(address?[1] ?? "")
        }
        
        let method = Mappers.mapFromPaymentMethod(paymentMethod)
        self.applePayRequestResolver?(Mappers.createResult("paymentMethod", method))
        self.applePayRequestRejecter = nil
    }
    
    @objc(confirmApplePayPayment:resolver:rejecter:)
    func confirmApplePayPayment(clientSecret: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.applePayCompletionRejecter = reject
        self.confirmApplePayPaymentResolver = resolve
        self.applePayCompletionCallback?(clientSecret, nil)
    }
    
    func applePayContext(_ context: STPApplePayContext, didCompleteWith status: STPPaymentStatus, error: Error?) {
        switch status {
        case .success:
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            confirmApplePayPaymentResolver?([])
            break
        case .error:
            let message = "Payment not completed"
            applePayCompletionRejecter?(ApplePayErrorType.Failed.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Failed.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        case .userCancellation:
            let message = "The payment has been canceled"
            applePayCompletionRejecter?(ApplePayErrorType.Canceled.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Canceled.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        @unknown default:
            let message = "Payment not completed"
            applePayCompletionRejecter?(ApplePayErrorType.Unknown.rawValue, message, nil)
            applePayRequestRejecter?(ApplePayErrorType.Unknown.rawValue, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
        }
    }
    
    @objc(isApplePaySupported:rejecter:)
    func isApplePaySupported(resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        let isSupported = StripeAPI.deviceSupportsApplePay()
        resolve(isSupported)
    }
  
    @objc(handleURLCallback:resolver:rejecter:)
    func handleURLCallback(url: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
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
  
    @objc(presentApplePay:resolver:rejecter:)
    func presentApplePay(params: NSDictionary,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        if (merchantIdentifier == nil) {
            reject(ApplePayErrorType.Failed.rawValue, "You must provide merchantIdentifier", nil)
            return
        }
        
        if (params["jcbEnabled"] as? Bool == true) {
            StripeAPI.additionalEnabledApplePayNetworks = [.JCB]
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
                applePayContext.presentApplePay(completion: nil)
            }
        } else {
            reject(ApplePayErrorType.Failed.rawValue, "Payment not completed", nil)
        }
    }

    func configure3dSecure(_ params: NSDictionary) {
        let threeDSCustomizationSettings = STPPaymentHandler.shared().threeDSCustomizationSettings
        let uiCustomization = Mappers.mapUICustomization(params)
        
        threeDSCustomizationSettings.uiCustomization = uiCustomization
    }
    
    @objc(createPaymentMethod:options:resolver:rejecter:)
    func createPaymentMethod(
        params: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(NextPaymentActionErrorType.Failed.rawValue, "You must provide paymentMethodType"))
            return
        }
        
        var paymentMethodParams: STPPaymentMethodParams?
        let factory = PaymentMethodFactory.init(params: params, cardFieldView: cardFieldView, cardFormView: cardFormView)
        
        do {
            paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
        } catch  {
            resolve(Errors.createError(NextPaymentActionErrorType.Failed.rawValue, error.localizedDescription))
            return
        }
        
        guard let params = paymentMethodParams else {
            resolve(Errors.createError(NextPaymentActionErrorType.Unknown.rawValue, "Unhandled error occured"))
            return
        }
        
        STPAPIClient.shared.createPaymentMethod(with: params) { paymentMethod, error in
            if let createError = error {
                resolve(Errors.createError(NextPaymentActionErrorType.Failed.rawValue, createError.localizedDescription))
                return
            }
            
            if let paymentMethod = paymentMethod {
                let method = Mappers.mapFromPaymentMethod(paymentMethod)
                resolve(Mappers.createResult("paymentMethod", method))
            }
        }
    }
    
    @objc(createToken:resolver:rejecter:)
    func createToken(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let address = params["address"] as? NSDictionary
        
        if let type = params["type"] as? String {
            if (type != "Card") {
                resolve(Errors.createError(CreateTokenErrorType.Failed.rawValue, type + " type is not supported yet"))
            }
        }
        
        guard let cardParams = cardFieldView?.cardParams ?? cardFormView?.cardParams else {
            resolve(Errors.createError(CreateTokenErrorType.Failed.rawValue, "Card details not complete"))
            return
        }
        
        let cardSourceParams = STPCardParams()
        cardSourceParams.number = cardParams.number
        cardSourceParams.cvc = cardParams.cvc
        cardSourceParams.expMonth = UInt(truncating: cardParams.expMonth ?? 0)
        cardSourceParams.expYear = UInt(truncating: cardParams.expYear ?? 0)
        cardSourceParams.address = Mappers.mapToAddress(address: address)
        cardSourceParams.name = params["name"] as? String

        STPAPIClient.shared.createToken(withCard: cardSourceParams) { token, error in
            if let token = token {
                resolve(Mappers.createResult("token", Mappers.mapFromToken(token: token)))
            } else {
                resolve(Errors.createError(CreateTokenErrorType.Failed.rawValue, error?.localizedDescription))
            }
        }
    }
    
    @objc(handleCardAction:resolver:rejecter:)
    func handleCardAction(
        paymentIntentClientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ){
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.handleNextAction(forPayment: paymentIntentClientSecret, with: self, returnURL: nil) { status, paymentIntent, handleActionError in
            switch (status) {
            case .failed:
                resolve(Errors.createError(NextPaymentActionErrorType.Failed.rawValue, handleActionError))
                break
            case .canceled:
                if let lastError = paymentIntent?.lastPaymentError {
                    resolve(Errors.createError(NextPaymentActionErrorType.Canceled.rawValue, lastError))
                } else {
                    resolve(Errors.createError(NextPaymentActionErrorType.Canceled.rawValue, "The payment has been canceled"))
                }
                break
            case .succeeded:
                if let paymentIntent = paymentIntent {
                    resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)))
                }
                break
            @unknown default:
                resolve(Errors.createError(NextPaymentActionErrorType.Unknown.rawValue, "Cannot complete payment"))
                break
            }
        }
    }

    @objc(confirmPayment:data:options:resolver:rejecter:)
    func confirmPayment(
        paymentIntentClientSecret: String,
        params: NSDictionary,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        self.confirmPaymentResolver = resolve
        self.confirmPaymentClientSecret = paymentIntentClientSecret
                
        let paymentMethodId = params["paymentMethodId"] as? String
        let paymentIntentParams = STPPaymentIntentParams(clientSecret: paymentIntentClientSecret)
        if let setupFutureUsage = params["setupFutureUsage"] as? String {
            paymentIntentParams.setupFutureUsage = Mappers.mapToPaymentIntentFutureUsage(usage: setupFutureUsage)
        }
                
        let type = Mappers.mapToPaymentMethodType(type: params["type"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, "You must provide paymentMethodType"))
            return
        }
        
        if (paymentMethodType == STPPaymentMethodType.FPX) {
            let testOfflineBank = params["testOfflineBank"] as? Bool
            if (testOfflineBank == false || testOfflineBank == nil) {
                payWithFPX(paymentIntentClientSecret)
                return
            }
        }
        if paymentMethodId != nil {
            paymentIntentParams.paymentMethodId = paymentMethodId
        } else {
            var paymentMethodParams: STPPaymentMethodParams?
            var paymentMethodOptions: STPConfirmPaymentMethodOptions?
            let factory = PaymentMethodFactory.init(params: params, cardFieldView: cardFieldView, cardFormView: cardFormView)
            
            do {
                paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
                paymentMethodOptions = try factory.createOptions(paymentMethodType: paymentMethodType)
            } catch  {
                resolve(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, error.localizedDescription))
                return
            }
            guard paymentMethodParams != nil else {
                resolve(Errors.createError(ConfirmPaymentErrorType.Unknown.rawValue, "Unhandled error occured"))
                return
            }
            paymentIntentParams.paymentMethodParams = paymentMethodParams
            paymentIntentParams.paymentMethodOptions = paymentMethodOptions
            paymentIntentParams.shipping = Mappers.mapToShippingDetails(shippingDetails: params["shippingDetails"] as? NSDictionary)
        }

         if let urlScheme = urlScheme {
            paymentIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme)
        }
        
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.confirmPayment(paymentIntentParams, with: self, completion: onCompleteConfirmPayment)
    }

    @objc(retrievePaymentIntent:resolver:rejecter:)
    func retrievePaymentIntent(
        clientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        STPAPIClient.shared.retrievePaymentIntent(withClientSecret: clientSecret) { (paymentIntent, error) in
            guard error == nil else {
                if let lastPaymentError = paymentIntent?.lastPaymentError {
                    resolve(Errors.createError(RetrievePaymentIntentErrorType.Unknown.rawValue, lastPaymentError))
                } else {
                    resolve(Errors.createError(RetrievePaymentIntentErrorType.Unknown.rawValue, error?.localizedDescription))
                }
               
                return
            }
            
            if let paymentIntent = paymentIntent {
                resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)))
            } else {
                resolve(Errors.createError(RetrievePaymentIntentErrorType.Unknown.rawValue, "Failed to retrieve the PaymentIntent"))
            }
        }
    }
    
    @objc(retrieveSetupIntent:resolver:rejecter:)
    func retrieveSetupIntent(
        clientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        STPAPIClient.shared.retrieveSetupIntent(withClientSecret: clientSecret) { (setupIntent, error) in
            guard error == nil else {
                if let lastSetupError = setupIntent?.lastSetupError {
                    resolve(Errors.createError(RetrieveSetupIntentErrorType.Unknown.rawValue, lastSetupError))
                } else {
                    resolve(Errors.createError(RetrieveSetupIntentErrorType.Unknown.rawValue, error?.localizedDescription))
                }
               
                return
            }
            
            if let setupIntent = setupIntent {
                resolve(Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent: setupIntent)))
            } else {
                resolve(Errors.createError(RetrieveSetupIntentErrorType.Unknown.rawValue, "Failed to retrieve the SetupIntent"))
            }
        }
    }
    
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        confirmPaymentResolver?(Errors.createError(ConfirmPaymentErrorType.Canceled.rawValue, "FPX Payment has been canceled"))
    }
            
    func payWithFPX(_ paymentIntentClientSecret: String) {
        let vc = STPBankSelectionViewController.init(bankMethod: .FPX)

        vc.delegate = self
        
        DispatchQueue.main.async {
            vc.presentationController?.delegate = self

            let share = UIApplication.shared.delegate
            share?.window??.rootViewController?.present(vc, animated: true)
        }
    }
    
    func bankSelectionViewController(_ bankViewController: STPBankSelectionViewController, didCreatePaymentMethodParams paymentMethodParams: STPPaymentMethodParams) {
        guard let clientSecret = confirmPaymentClientSecret else {
            confirmPaymentResolver?(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, "Missing paymentIntentClientSecret"))
            return
        }
        let paymentIntentParams = STPPaymentIntentParams(clientSecret: clientSecret)
        paymentIntentParams.paymentMethodParams = paymentMethodParams
        
        if let urlScheme = urlScheme {
            paymentIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme)
        }
        let paymentHandler = STPPaymentHandler.shared()
        bankViewController.dismiss(animated: true)
        paymentHandler.confirmPayment(paymentIntentParams, with: self, completion: onCompleteConfirmPayment)
    }
        
    func onCompleteConfirmPayment(status: STPPaymentHandlerActionStatus, paymentIntent: STPPaymentIntent?, error: NSError?) {
        self.confirmPaymentClientSecret = nil
        switch (status) {
        case .failed:
            confirmPaymentResolver?(Errors.createError(ConfirmPaymentErrorType.Failed.rawValue, error))
            break
        case .canceled:
            let statusCode: String
            if (paymentIntent?.status == STPPaymentIntentStatus.requiresPaymentMethod) {
                statusCode = ConfirmPaymentErrorType.Failed.rawValue
            } else {
                statusCode = ConfirmPaymentErrorType.Canceled.rawValue
            }
            if let lastPaymentError = paymentIntent?.lastPaymentError {
                confirmPaymentResolver?(Errors.createError(statusCode, lastPaymentError))
            } else {
                confirmPaymentResolver?(Errors.createError(statusCode, "The payment has been canceled"))
            }
            break
        case .succeeded:
            if let paymentIntent = paymentIntent {
                let intent = Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)
                confirmPaymentResolver?(Mappers.createResult("paymentIntent", intent))
            }
            break
        @unknown default:
            confirmPaymentResolver?(Errors.createError(ConfirmPaymentErrorType.Unknown.rawValue, "Cannot complete the payment"))
            break
        }
    }
}

func findViewControllerPresenter(from uiViewController: UIViewController) -> UIViewController {
    // Note: creating a UIViewController inside here results in a nil window
    // This is a bit of a hack: We traverse the view hierarchy looking for the most reasonable VC to present from.
    // A VC hosted within a SwiftUI cell, for example, doesn't have a parent, so we need to find the UIWindow.
    var presentingViewController: UIViewController =
        uiViewController.view.window?.rootViewController ?? uiViewController

    // Find the most-presented UIViewController
    while let presented = presentingViewController.presentedViewController {
        presentingViewController = presented
    }

    return presentingViewController
}

extension StripeSdk: STPAuthenticationContext {
    func authenticationPresentingViewController() -> UIViewController {
        return findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
    }
}
