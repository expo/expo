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

    @objc override func constantsToExport() -> [AnyHashable : Any] {
        return [
            "API_VERSIONS": [
                "CORE": STPAPIClient.apiVersion,
                "ISSUING": STPAPIClient.apiVersion,
            ]
        ]
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
        self.paymentSheetFlowController = nil

        if let appearanceParams = params["appearance"] as? NSDictionary {
            do {
                configuration.appearance = try buildPaymentSheetAppearance(userParams: appearanceParams)
            } catch {
                resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
                return
            }
        }

        if  params["applePay"] as? Bool == true {
            if let merchantIdentifier = self.merchantIdentifier, let merchantCountryCode = params["merchantCountryCode"] as? String {
                configuration.applePay = .init(merchantId: merchantIdentifier,
                                               merchantCountryCode: merchantCountryCode)
            } else {
                resolve(Errors.createError(ErrorType.Failed, "Either merchantIdentifier or merchantCountryCode is missing"))
                return
            }
        }

        if let merchantDisplayName = params["merchantDisplayName"] as? String {
            configuration.merchantDisplayName = merchantDisplayName
        }

        if let returnURL = params["returnURL"] as? String {
            configuration.returnURL = returnURL
        }

        if let allowsDelayedPaymentMethods = params["allowsDelayedPaymentMethods"] as? Bool {
            configuration.allowsDelayedPaymentMethods = allowsDelayedPaymentMethods
        }

        if let defaultBillingDetails = params["defaultBillingDetails"] as? [String: Any?] {
            configuration.defaultBillingDetails.name = defaultBillingDetails["name"] as? String
            configuration.defaultBillingDetails.email = defaultBillingDetails["email"] as? String
            configuration.defaultBillingDetails.phone = defaultBillingDetails["phone"] as? String

            if let address = defaultBillingDetails["address"] as? [String: String] {
            configuration.defaultBillingDetails.address = .init(city: address["city"],
                                                                country: address["country"],
                                                                line1: address["line1"],
                                                                line2: address["line2"],
                                                                postalCode: address["postalCode"],
                                                                state: address["state"])
            }

        }

        if let customerId = params["customerId"] as? String {
            if let customerEphemeralKeySecret = params["customerEphemeralKeySecret"] as? String {
                if (!Errors.isEKClientSecretValid(clientSecret: customerEphemeralKeySecret)) {
                    resolve(Errors.createError(ErrorType.Failed, "`customerEphemeralKeySecret` format does not match expected client secret formatting."))
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
                resolve(Errors.createError(ErrorType.Failed, error as NSError))
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
                resolve(Errors.createError(ErrorType.Failed, "`secret` format does not match expected client secret formatting."))
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
                resolve(Errors.createError(ErrorType.Failed, "`secret` format does not match expected client secret formatting."))
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
            resolve(Errors.createError(ErrorType.Failed, "You must provide either paymentIntentClientSecret or setupIntentClientSecret"))
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
                        resolve(Errors.createError(ErrorType.Canceled, "The payment flow has been canceled"))
                    case .failed(let error):
                        resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
                    }

                }
            } else {
                resolve(Errors.createError(ErrorType.Failed, "No payment sheet has been initialized yet"))
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
                        resolve(Errors.createError(ErrorType.Canceled, "The payment option selection flow has been canceled"))
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
                        resolve(Errors.createError(ErrorType.Canceled, "The payment has been canceled"))
                    case .failed(let error):
                        resolve(Errors.createError(ErrorType.Failed, error as NSError))
                    }
                }
            } else {
                resolve(Errors.createError(ErrorType.Failed, "No payment sheet has been initialized yet"))
            }
        }
    }

    @objc(createTokenForCVCUpdate:resolver:rejecter:)
    func createTokenForCVCUpdate(cvc: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cvc = cvc else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide CVC"))
            return;
        }

        STPAPIClient.shared.createToken(forCVCUpdate: cvc) { (token, error) in
            if error != nil || token == nil {
                resolve(Errors.createError(ErrorType.Failed, error?.localizedDescription ?? ""))
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
        let paymentMethodData = params["paymentMethodData"] as? NSDictionary
        let type = Mappers.mapToPaymentMethodType(type: params["paymentMethodType"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide paymentMethodType."))
            return
        }

        if (paymentMethodType == .payPal) {
            resolve(Errors.createError(ErrorType.Failed, "PayPal is not yet supported through SetupIntents."))
        }

        var err: NSDictionary? = nil
        let setupIntentParams: STPSetupIntentConfirmParams = {
            // If payment method data is not supplied, assume payment method was attached through via collectBankAccount
            if (paymentMethodType == .USBankAccount && paymentMethodData == nil) {
                return STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret, paymentMethodType: .USBankAccount)
            } else {
                let parameters = STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret)
                let factory = PaymentMethodFactory.init(paymentMethodData: paymentMethodData, options: options, cardFieldView: cardFieldView, cardFormView: cardFormView)
                do {
                    let paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
                    parameters.paymentMethodParams = paymentMethodParams
                } catch  {
                    err = Errors.createError(ErrorType.Failed, error as NSError?)
                }

                return parameters
            }
        }()

        if (err != nil) {
            resolve(err)
            return
        }

        if let urlScheme = urlScheme {
            setupIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme)
        }

        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.confirmSetupIntent(setupIntentParams, with: self) { status, setupIntent, error in
            switch (status) {
            case .failed:
                resolve(Errors.createError(ErrorType.Failed, error))
                break
            case .canceled:
                if let lastError = setupIntent?.lastSetupError {
                    resolve(Errors.createError(ErrorType.Canceled, lastError))
                } else {
                    resolve(Errors.createError(ErrorType.Canceled, "The payment has been canceled"))
                }
                break
            case .succeeded:
                let intent = Mappers.mapFromSetupIntent(setupIntent: setupIntent!)
                resolve(Mappers.createResult("setupIntent", intent))
            @unknown default:
                resolve(Errors.createError(ErrorType.Unknown, error))
                break
            }
        }
    }

    @objc(updateApplePaySummaryItems:errorAddressFields:resolver:rejecter:)
    func updateApplePaySummaryItems(summaryItems: NSArray, errorAddressFields: [NSDictionary], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if (shippingMethodUpdateHandler == nil && shippingContactUpdateHandler == nil) {
            resolve(Errors.createError(ErrorType.Failed, "You can use this method only after either onDidSetShippingMethod or onDidSetShippingContact events emitted"))
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
            resolve(Errors.createError(ErrorType.Failed, "Cannot open payment setup"))
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
            applePayCompletionRejecter?(ErrorType.Failed, message, nil)
            applePayRequestRejecter?(ErrorType.Failed, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        case .userCancellation:
            let message = "The payment has been canceled"
            applePayCompletionRejecter?(ErrorType.Canceled, message, nil)
            applePayRequestRejecter?(ErrorType.Canceled, message, nil)
            applePayCompletionRejecter = nil
            applePayRequestRejecter = nil
            break
        @unknown default:
            let message = "Payment not completed"
            applePayCompletionRejecter?(ErrorType.Unknown, message, nil)
            applePayRequestRejecter?(ErrorType.Unknown, message, nil)
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
            reject(ErrorType.Failed, "You must provide merchantIdentifier", nil)
            return
        }

        if (params["jcbEnabled"] as? Bool == true) {
            StripeAPI.additionalEnabledApplePayNetworks = [.JCB]
        }

        guard let summaryItems = params["cartItems"] as? NSArray else {
            reject(ErrorType.Failed, "You must provide the items for purchase", nil)
            return
        }
        guard let country = params["country"] as? String else {
            reject(ErrorType.Failed, "You must provide the country", nil)
            return
        }
        guard let currency = params["currency"] as? String else {
            reject(ErrorType.Failed, "You must provide the payment currency", nil)
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
            reject(ErrorType.Failed, "Payment not completed", nil)
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
        let type = Mappers.mapToPaymentMethodType(type: params["paymentMethodType"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide paymentMethodType"))
            return
        }

        var paymentMethodParams: STPPaymentMethodParams?
        let factory = PaymentMethodFactory.init(
            paymentMethodData: params["paymentMethodData"] as? NSDictionary,
            options: options,
            cardFieldView: cardFieldView,
            cardFormView: cardFormView
        )
        do {
            paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
        } catch  {
            resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
            return
        }

        if let paymentMethodParams = paymentMethodParams {
            STPAPIClient.shared.createPaymentMethod(with: paymentMethodParams) { paymentMethod, error in
                if let createError = error {
                    resolve(Errors.createError(ErrorType.Failed, createError.localizedDescription))
                    return
                }

                if let paymentMethod = paymentMethod {
                    let method = Mappers.mapFromPaymentMethod(paymentMethod)
                    resolve(Mappers.createResult("paymentMethod", method))
                }
            }
        } else {
            resolve(Errors.createError(ErrorType.Unknown, "Unhandled error occured"))
        }
    }

    @objc(createToken:resolver:rejecter:)
    func createToken(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let type = params["type"] as? String else {
            resolve(Errors.createError(ErrorType.Failed, "type parameter is required"))
            return
        }

        // TODO: Consider moving this to its own class when more types are supported.
        switch type {
        case "BankAccount":
            createTokenFromBankAccount(params: params, resolver: resolve, rejecter: reject)
        case "Card":
            createTokenFromCard(params: params, resolver: resolve, rejecter: reject)
        case "Pii":
            createTokenFromPii(params: params, resolver: resolve, rejecter: reject)
        default:
            resolve(Errors.createError(ErrorType.Failed, type + " type is not supported yet"))
        }
    }

    func createTokenFromBankAccount(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let accountHolderName = params["accountHolderName"] as? String
        let accountHolderType = params["accountHolderType"] as? String
        let accountNumber = params["accountNumber"] as? String
        let country = params["country"] as? String
        let currency = params["currency"] as? String
        let routingNumber = params["routingNumber"] as? String

        let bankAccountParams = STPBankAccountParams()
        bankAccountParams.accountHolderName = accountHolderName
        bankAccountParams.accountNumber = accountNumber
        bankAccountParams.country = country
        bankAccountParams.currency = currency
        bankAccountParams.routingNumber = routingNumber
        bankAccountParams.accountHolderType = Mappers.mapToBankAccountHolderType(accountHolderType)


        STPAPIClient.shared.createToken(withBankAccount: bankAccountParams) { token, error in
            if let token = token {
                resolve(Mappers.createResult("token", Mappers.mapFromToken(token: token)))
            } else {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            }
        }
    }

    func createTokenFromPii(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let personalId = params["personalId"] as? String else {
            resolve(Errors.createError(ErrorType.Failed, "personalId parameter is required"))
            return
        }

        STPAPIClient.shared.createToken(withPersonalIDNumber: personalId) { token, error in
            if let token = token {
                resolve(Mappers.createResult("token", Mappers.mapFromToken(token: token)))
            } else {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            }
        }
    }

    func createTokenFromCard(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let cardParams = cardFieldView?.cardParams ?? cardFormView?.cardParams else {
            resolve(Errors.createError(ErrorType.Failed, "Card details not complete"))
            return
        }

        let address = params["address"] as? NSDictionary
        let cardSourceParams = STPCardParams()
        cardSourceParams.number = cardParams.number
        cardSourceParams.cvc = cardParams.cvc
        cardSourceParams.expMonth = UInt(truncating: cardParams.expMonth ?? 0)
        cardSourceParams.expYear = UInt(truncating: cardParams.expYear ?? 0)
        cardSourceParams.address = Mappers.mapToAddress(address: address)
        cardSourceParams.name = params["name"] as? String
        cardSourceParams.currency = params["currency"] as? String

        STPAPIClient.shared.createToken(withCard: cardSourceParams) { token, error in
            if let token = token {
                resolve(Mappers.createResult("token", Mappers.mapFromToken(token: token)))
            } else {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            }
        }
    }

    @objc(handleNextAction:resolver:rejecter:)
    func handleNextAction(
        paymentIntentClientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ){
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.handleNextAction(forPayment: paymentIntentClientSecret, with: self, returnURL: nil) { status, paymentIntent, handleActionError in
            switch (status) {
            case .failed:
                resolve(Errors.createError(ErrorType.Failed, handleActionError))
                break
            case .canceled:
                if let lastError = paymentIntent?.lastPaymentError {
                    resolve(Errors.createError(ErrorType.Canceled, lastError))
                } else {
                    resolve(Errors.createError(ErrorType.Canceled, "The payment has been canceled"))
                }
                break
            case .succeeded:
                if let paymentIntent = paymentIntent {
                    resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)))
                }
                break
            @unknown default:
                resolve(Errors.createError(ErrorType.Unknown, "Cannot complete payment"))
                break
            }
        }
    }

    @objc(collectBankAccount:clientSecret:params:resolver:rejecter:)
    func collectBankAccount(
        isPaymentIntent: Bool,
        clientSecret: NSString,
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let paymentMethodData = params["paymentMethodData"] as? NSDictionary
        let type = Mappers.mapToPaymentMethodType(type: params["paymentMethodType"] as? String)
        if (type != STPPaymentMethodType.USBankAccount) {
            resolve(Errors.createError(ErrorType.Failed, "collectBankAccount currently only accepts the USBankAccount payment method type."))
            return
        }

        guard let billingDetails = paymentMethodData?["billingDetails"] as? [String: Any?], let name = billingDetails["name"] as? String else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide a name when collecting US bank account details."))
            return
        }

        if (name.isEmpty) {
            resolve(Errors.createError(ErrorType.Failed, "You must provide a name when collecting US bank account details."))
            return
        }

        let collectParams = STPCollectBankAccountParams.collectUSBankAccountParams(
            with: name,
            email: billingDetails["email"] as? String
        )

        if (isPaymentIntent) {
            DispatchQueue.main.async {
                STPBankAccountCollector().collectBankAccountForPayment(
                    clientSecret: clientSecret as String,
                    params: collectParams,
                    from: findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
                ) { intent, error in
                    if let error = error {
                        resolve(Errors.createError(ErrorType.Failed, error as NSError))
                        return
                    }

                    if let intent = intent {
                        if (intent.status == .requiresPaymentMethod) {
                            resolve(Errors.createError(ErrorType.Canceled, "Bank account collection was canceled."))
                        }
                        resolve(
                            Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: intent))
                        )
                    } else {
                        resolve(Errors.createError(ErrorType.Unknown, "There was unexpected error while collecting bank account information."))
                    }
                }
            }
        } else {
            DispatchQueue.main.async {
                STPBankAccountCollector().collectBankAccountForSetup(
                    clientSecret: clientSecret as String,
                    params: collectParams,
                    from: findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
                ) { intent, error in
                    if let error = error {
                        resolve(Errors.createError(ErrorType.Failed, error as NSError))
                        return
                    }

                    if let intent = intent {
                        if (intent.status == .requiresPaymentMethod) {
                            resolve(Errors.createError(ErrorType.Canceled, "Bank account collection was canceled."))
                        }
                        resolve(
                            Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent: intent))
                        )
                    } else {
                        resolve(Errors.createError(ErrorType.Unknown, "There was unexpected error while collecting bank account information."))
                    }
                }
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

        let paymentMethodData = params["paymentMethodData"] as? NSDictionary
        let type = Mappers.mapToPaymentMethodType(type: params["paymentMethodType"] as? String)
        guard let paymentMethodType = type else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide paymentMethodType"))
            return
        }

        if (paymentMethodType == .FPX) {
            let testOfflineBank = paymentMethodData?["testOfflineBank"] as? Bool
            if (testOfflineBank == false || testOfflineBank == nil) {
                payWithFPX(paymentIntentClientSecret)
                return
            }
        }

        let (error, paymentIntentParams) = createPaymentIntentParams(paymentIntentClientSecret: paymentIntentClientSecret, paymentMethodType: paymentMethodType, paymentMethodData: paymentMethodData, options: options)

        if (error != nil) {
            resolve(error)
        } else {
            STPPaymentHandler.shared().confirmPayment(paymentIntentParams, with: self, completion: onCompleteConfirmPayment)
        }
    }

    func createPaymentIntentParams(
        paymentIntentClientSecret: String,
        paymentMethodType: STPPaymentMethodType,
        paymentMethodData: NSDictionary?,
        options: NSDictionary
    ) -> (NSDictionary?, STPPaymentIntentParams) {
        let factory = PaymentMethodFactory.init(paymentMethodData: paymentMethodData, options: options, cardFieldView: cardFieldView, cardFormView: cardFormView)
        var err: NSDictionary? = nil

        let paymentIntentParams: STPPaymentIntentParams = {
            // If payment method data is not supplied, assume payment method was attached through via collectBankAccount
            if (paymentMethodType == .USBankAccount && paymentMethodData == nil) {
                return STPPaymentIntentParams(clientSecret: paymentIntentClientSecret, paymentMethodType: .USBankAccount)
            } else {
                let paymentMethodId = paymentMethodData?["paymentMethodId"] as? String
                let parameters = STPPaymentIntentParams(clientSecret: paymentIntentClientSecret)

                if paymentMethodId != nil {
                    parameters.paymentMethodId = paymentMethodId
                } else {
                    do {
                        let paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
                        let paymentMethodOptions = try factory.createOptions(paymentMethodType: paymentMethodType)
                        parameters.paymentMethodParams = paymentMethodParams
                        parameters.paymentMethodOptions = paymentMethodOptions
                    } catch  {
                        err = Errors.createError(ErrorType.Failed, error as NSError?)
                    }
                }
                return parameters
            }
        }()

        if let setupFutureUsage = options["setupFutureUsage"] as? String {
            paymentIntentParams.setupFutureUsage = Mappers.mapToPaymentIntentFutureUsage(usage: setupFutureUsage)
        }
        if let urlScheme = urlScheme {
            paymentIntentParams.returnURL = Mappers.mapToReturnURL(urlScheme: urlScheme)
        }
        paymentIntentParams.shipping = Mappers.mapToShippingDetails(shippingDetails: paymentMethodData?["shippingDetails"] as? NSDictionary)

        return (err, paymentIntentParams)
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
                    resolve(Errors.createError(ErrorType.Unknown, lastPaymentError))
                } else {
                    resolve(Errors.createError(ErrorType.Unknown, error?.localizedDescription))
                }

                return
            }

            if let paymentIntent = paymentIntent {
                resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: paymentIntent)))
            } else {
                resolve(Errors.createError(ErrorType.Unknown, "Failed to retrieve the PaymentIntent"))
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
                    resolve(Errors.createError(ErrorType.Unknown, lastSetupError))
                } else {
                    resolve(Errors.createError(ErrorType.Unknown, error?.localizedDescription))
                }

                return
            }

            if let setupIntent = setupIntent {
                resolve(Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent: setupIntent)))
            } else {
                resolve(Errors.createError(ErrorType.Unknown, "Failed to retrieve the SetupIntent"))
            }
        }
    }

    @objc(verifyMicrodeposits:clientSecret:params:resolver:rejecter:)
    func verifyMicrodeposits(
        isPaymentIntent: Bool,
        clientSecret: NSString,
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let amounts = params["amounts"] as? NSArray
        let descriptorCode = params["descriptorCode"] as? String

        if (amounts != nil && descriptorCode != nil || amounts == nil && descriptorCode == nil) {
            resolve(Errors.createError(ErrorType.Failed, "You must provide either amounts OR descriptorCode, not both."))
            return
        }

        if let amounts = amounts {
            if (amounts.count != 2) {
                resolve(Errors.createError(ErrorType.Failed, "Expected 2 integers in the amounts array, but received " + String(amounts.count)))
                return
            }
            if (isPaymentIntent) {
                STPAPIClient.shared.verifyPaymentIntentWithMicrodeposits(
                    clientSecret: clientSecret as String,
                    firstAmount: amounts[0] as! Int,
                    secondAmount: amounts[1] as! Int,
                    completion: onCompletePaymentVerification
                )
            } else {
                STPAPIClient.shared.verifySetupIntentWithMicrodeposits(
                    clientSecret: clientSecret as String,
                    firstAmount: amounts[0] as! Int,
                    secondAmount: amounts[1] as! Int,
                    completion: onCompleteSetupVerification
                )
            }
        } else if let descriptorCode = descriptorCode {
            if (isPaymentIntent) {
                STPAPIClient.shared.verifyPaymentIntentWithMicrodeposits(
                    clientSecret: clientSecret as String,
                    descriptorCode: descriptorCode,
                    completion: onCompletePaymentVerification
                )
            } else {
                STPAPIClient.shared.verifySetupIntentWithMicrodeposits(
                    clientSecret: clientSecret as String,
                    descriptorCode: descriptorCode,
                    completion: onCompleteSetupVerification
                )
            }
        }

        func onCompletePaymentVerification(intent: STPPaymentIntent?, error: Error?) {
            if (error != nil) {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            } else {
                resolve(Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent:intent!)))
            }
        }
        func onCompleteSetupVerification(intent: STPSetupIntent?, error: Error?) {
            if (error != nil) {
                resolve(Errors.createError(ErrorType.Failed, error as NSError?))
            } else {
                resolve(Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent:intent!)))
            }
        }
    }

    @objc(isCardInWallet:resolver:rejecter:)
    func isCardInWallet(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let last4 = params["cardLastFour"] as? String else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide `cardLastFour`"))
            return
        }

        let existingPass: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().passes(of: PKPassType.secureElement).first(where: {$0.secureElementPass?.primaryAccountNumberSuffix == last4})
            } else {
                return PKPassLibrary().passes(of: PKPassType.payment).first(where: {$0.paymentPass?.primaryAccountNumberSuffix == last4})
            }
        }()
        resolve(["isInWallet": existingPass != nil])
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        confirmPaymentResolver?(Errors.createError(ErrorType.Canceled, "FPX Payment has been canceled"))
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
            confirmPaymentResolver?(Errors.createError(ErrorType.Failed, "Missing paymentIntentClientSecret"))
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
            confirmPaymentResolver?(Errors.createError(ErrorType.Failed, error))
            break
        case .canceled:
            let statusCode: String
            if (paymentIntent?.status == STPPaymentIntentStatus.requiresPaymentMethod) {
                statusCode = ErrorType.Failed
            } else {
                statusCode = ErrorType.Canceled
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
            confirmPaymentResolver?(Errors.createError(ErrorType.Unknown, "Cannot complete the payment"))
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
