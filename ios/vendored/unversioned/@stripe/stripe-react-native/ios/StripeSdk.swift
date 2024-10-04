import PassKit
import Stripe
import StripePaymentSheet
import StripeFinancialConnections

@objc(StripeSdk)
class StripeSdk: RCTEventEmitter, STPBankSelectionViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
    public var cardFieldView: CardFieldView? = nil
    public var cardFormView: CardFormView? = nil

    var merchantIdentifier: String? = nil

    private var paymentSheet: PaymentSheet?
    private var paymentSheetFlowController: PaymentSheet.FlowController?

    var urlScheme: String? = nil
    
    var confirmPaymentResolver: RCTPromiseResolveBlock? = nil

    var applePayCompletionCallback: STPIntentClientSecretCompletionBlock? = nil
    var deprecatedApplePayRequestResolver: RCTPromiseResolveBlock? = nil
    var deprecatedApplePayRequestRejecter: RCTPromiseRejectBlock? = nil
    var deprecatedApplePayCompletionRejecter: RCTPromiseRejectBlock? = nil
    var deprecatedConfirmApplePayPaymentResolver: RCTPromiseResolveBlock? = nil
    
    var confirmApplePayResolver: RCTPromiseResolveBlock? = nil
    var confirmApplePayPaymentClientSecret: String? = nil
    var confirmApplePaySetupClientSecret: String? = nil
    
    var applePaymentAuthorizationController: PKPaymentAuthorizationViewController? = nil
    var createPlatformPayPaymentMethodResolver: RCTPromiseResolveBlock? = nil
    var platformPayUsesDeprecatedTokenFlow = false
    var applePaymentMethodFlowCanBeCanceled = false
    
    var confirmPaymentClientSecret: String? = nil

    var shippingMethodUpdateCompletion: ((PKPaymentRequestShippingMethodUpdate) -> Void)? = nil
    var shippingContactUpdateCompletion: ((PKPaymentRequestShippingContactUpdate) -> Void)? = nil
    @available(iOS 15.0, *)
    var couponCodeUpdateCompletion: ((PKPaymentRequestCouponCodeUpdate) -> Void)? {
        get { _couponCodeUpdateCompletion as? ((PKPaymentRequestCouponCodeUpdate) -> Void) }
        set { _couponCodeUpdateCompletion = newValue }
    }
    private var _couponCodeUpdateCompletion: Any? = nil
    var shippingMethodUpdateJSCallback: RCTDirectEventBlock? = nil
    var shippingContactUpdateJSCallback: RCTDirectEventBlock? = nil
    var couponCodeEnteredJSCallback: RCTDirectEventBlock? = nil
    var applePaySummaryItems: [PKPaymentSummaryItem] = []
    var applePayShippingMethods: [PKShippingMethod] = []
    var applePayShippingAddressErrors: [Error]? = nil
    var applePayCouponCodeErrors: [Error]? = nil
    
    var hasLegacyApplePayListeners = false
    override func startObserving() {
        hasLegacyApplePayListeners = true
    }
    override func stopObserving() {
        hasLegacyApplePayListeners = false
    }
    
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
        StripeAPI.defaultPublishableKey = publishableKey
        STPAPIClient.shared.stripeAccount = stripeAccountId

        let name = appInfo["name"] as? String ?? ""
        let partnerId = appInfo["partnerId"] as? String ?? ""
        let version = appInfo["version"] as? String ?? ""
        let url = appInfo["url"] as? String ?? ""

        STPAPIClient.shared.appInfo = STPAppInfo(name: name, partnerId: partnerId, version: version, url: url)
        self.merchantIdentifier = merchantIdentifier
        resolve(NSNull())
    }

    @objc(initPaymentSheet:resolver:rejecter:)
    func initPaymentSheet(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) -> Void  {
        var configuration = PaymentSheet.Configuration()
        self.paymentSheetFlowController = nil
        
        configuration.primaryButtonLabel = params["primaryButtonLabel"] as? String

        if let appearanceParams = params["appearance"] as? NSDictionary {
            do {
                configuration.appearance = try PaymentSheetAppearance.buildAppearanceFromParams(userParams: appearanceParams)
            } catch {
                resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
                return
            }
        }

        if let applePayParams = params["applePay"] as? NSDictionary {
            do {
                configuration.applePay = try ApplePayUtils.buildPaymentSheetApplePayConfig(
                    merchantIdentifier: self.merchantIdentifier,
                    merchantCountryCode: applePayParams["merchantCountryCode"] as? String,
                    paymentSummaryItems: applePayParams["paymentSummaryItems"] as? [[String : Any]]
                )
            } catch  {
                resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
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
        
        if let defaultShippingDetails = params["defaultShippingDetails"] as? NSDictionary {
            configuration.shippingDetails = {
                return AddressSheetUtils.buildAddressDetails(params: defaultShippingDetails)
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
                var result: NSDictionary? = nil
                if let paymentOption = stripeSdk?.paymentSheetFlowController?.paymentOption {
                    result = [
                        "label": paymentOption.label,
                        "image": paymentOption.image.pngData()?.base64EncodedString() ?? ""
                    ]
                }
                resolve(Mappers.createResult("paymentOption", result))
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
    
    @objc(resetPaymentSheetCustomer:rejecter:)
    func resetPaymentSheetCustomer(resolver resolve: @escaping RCTPromiseResolveBlock,
                                   rejecter reject: @escaping RCTPromiseRejectBlock) -> Void  {
        PaymentSheet.resetCustomer()
        resolve(nil)
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
            return
        }

        var err: NSDictionary? = nil
        let setupIntentParams: STPSetupIntentConfirmParams = {
            // If payment method data is not supplied, assume payment method was attached through via collectBankAccount
            if (paymentMethodType == .USBankAccount && paymentMethodData == nil) {
                return STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret, paymentMethodType: .USBankAccount)
            } else {
                let parameters = STPSetupIntentConfirmParams(clientSecret: setupIntentClientSecret)

                if let paymentMethodId = paymentMethodData?["paymentMethodId"] as? String {
                    parameters.paymentMethodID = paymentMethodId
                } else {
                    let factory = PaymentMethodFactory.init(paymentMethodData: paymentMethodData, options: options, cardFieldView: cardFieldView, cardFormView: cardFormView)
                    do {
                        let paymentMethodParams = try factory.createParams(paymentMethodType: paymentMethodType)
                        parameters.paymentMethodParams = paymentMethodParams
                    } catch  {
                        err = Errors.createError(ErrorType.Failed, error as NSError?)
                    }
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

    @objc(updatePlatformPaySheet:shippingMethods:errors:resolver:rejecter:)
    func updatePlatformPaySheet(summaryItems: NSArray,
                             shippingMethods: NSArray,
                             errors: [NSDictionary],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock)
    {
        let couponUpdateHandlerIsNil: Bool = {
            if #available(iOS 15.0, *), self.couponCodeUpdateCompletion == nil {
                return true
            }
            return false
        }()
        
        if (shippingMethodUpdateCompletion == nil && shippingContactUpdateCompletion == nil && couponUpdateHandlerIsNil) {
            resolve(Errors.createError(ErrorType.Failed, "You can use this method only after either onShippingContactSelected, onShippingMethodSelected, or onCouponCodeEntered callbacks are triggered"))
            return
        }
        
        do {
            applePaySummaryItems = try ApplePayUtils.buildPaymentSummaryItems(items: summaryItems as? [[String : Any]])
        } catch {
            resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
            return
        }
        
        applePayShippingMethods = ApplePayUtils.buildShippingMethods(items: shippingMethods as? [[String : Any]])
        
        do {
            (applePayShippingAddressErrors, applePayCouponCodeErrors) = try ApplePayUtils.buildApplePayErrors(errorItems: errors)
        } catch {
            resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
            return
        }
        

        shippingMethodUpdateCompletion?(PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: applePaySummaryItems))
        shippingContactUpdateCompletion?(PKPaymentRequestShippingContactUpdate.init(errors: applePayShippingAddressErrors, paymentSummaryItems: applePaySummaryItems, shippingMethods: applePayShippingMethods))
        if #available(iOS 15.0, *) {
            couponCodeUpdateCompletion?(PKPaymentRequestCouponCodeUpdate.init(errors: applePayCouponCodeErrors, paymentSummaryItems: applePaySummaryItems, shippingMethods: applePayShippingMethods))
            self.couponCodeUpdateCompletion = nil
        }
        self.shippingMethodUpdateCompletion = nil
        self.shippingContactUpdateCompletion = nil
        resolve([])
    }
    
    @objc(updateApplePaySummaryItems:errorAddressFields:resolver:rejecter:)
    func updateApplePaySummaryItems(summaryItems: NSArray, errorAddressFields: [NSDictionary], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if (shippingMethodUpdateCompletion == nil && shippingContactUpdateCompletion == nil) {
            resolve(Errors.createError(ErrorType.Failed, "You can use this method only after either onDidSetShippingMethod or onDidSetShippingContact events emitted"))
            return
        }

        var paymentSummaryItems : [PKPaymentSummaryItem] = []
        do {
            paymentSummaryItems = try ApplePayUtils.buildPaymentSummaryItems(items: summaryItems as? [[String : Any]])
        } catch {
            resolve(Errors.createError(ErrorType.Failed, error.localizedDescription))
            return
        }

        var shippingAddressErrors: [Error] = []
        for item in errorAddressFields {
            let field = item["field"] as! String
            let message = item["message"] as? String ?? field + " error"
            shippingAddressErrors.append(PKPaymentRequest.paymentShippingAddressInvalidError(withKey: field, localizedDescription: message))
        }

        shippingMethodUpdateCompletion?(PKPaymentRequestShippingMethodUpdate.init(paymentSummaryItems: paymentSummaryItems))
        shippingContactUpdateCompletion?(PKPaymentRequestShippingContactUpdate.init(errors: shippingAddressErrors, paymentSummaryItems: paymentSummaryItems, shippingMethods: []))
        self.shippingMethodUpdateCompletion = nil
        self.shippingContactUpdateCompletion = nil
        resolve([])
    }

    @objc(openApplePaySetup:rejecter:)
    func openApplePaySetup(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        PKPassLibrary.init().openPaymentSetup()
        resolve([])
    }

    @objc(confirmApplePayPayment:resolver:rejecter:)
    func confirmApplePayPayment(clientSecret: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.deprecatedApplePayCompletionRejecter = reject
        self.deprecatedConfirmApplePayPaymentResolver = resolve
        self.applePayCompletionCallback?(clientSecret, nil)
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
        self.deprecatedApplePayRequestResolver = resolve
        self.deprecatedApplePayRequestRejecter = reject
        
        let (error, paymentRequest) = ApplePayUtils.createPaymentRequest(merchantIdentifier: merchantIdentifier, params: params)
        guard let paymentRequest = paymentRequest else {
            resolve(error)
            return
        }
        
        if let applePayContext = STPApplePayContext(paymentRequest: paymentRequest, delegate: self) {
            DispatchQueue.main.async {
                applePayContext.presentApplePay(completion: nil)
            }
        } else {
            resolve(Errors.createError(ErrorType.Failed, "Payment not completed"))
        }
    }
    
    @objc(isPlatformPaySupported:resolver:rejecter:)
    func isPlatformPaySupported(params: NSDictionary,
                                          resolver resolve: @escaping RCTPromiseResolveBlock,
                                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(StripeAPI.deviceSupportsApplePay())
    }
    
    @objc(createPlatformPayPaymentMethod:usesDeprecatedTokenFlow:resolver:rejecter:)
    func createPlatformPayPaymentMethod(params: NSDictionary,
                                        usesDeprecatedTokenFlow: Bool,
                                          resolver resolve: @escaping RCTPromiseResolveBlock,
                                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let applePayPatams = params["applePay"] as? NSDictionary else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide the `applePay` parameter."))
            return
        }
        let (error, paymentRequest) = ApplePayUtils.createPaymentRequest(merchantIdentifier: merchantIdentifier, params: applePayPatams)
        guard let paymentRequest = paymentRequest else {
            resolve(error)
            return
        }
        
        self.applePaySummaryItems = paymentRequest.paymentSummaryItems
        self.applePayShippingMethods = paymentRequest.shippingMethods ?? []
        self.applePayShippingAddressErrors = nil
        self.applePayCouponCodeErrors = nil
        platformPayUsesDeprecatedTokenFlow = usesDeprecatedTokenFlow
        applePaymentMethodFlowCanBeCanceled = true
        createPlatformPayPaymentMethodResolver = resolve
        self.applePaymentAuthorizationController = PKPaymentAuthorizationViewController(paymentRequest: paymentRequest)
        if let applePaymentAuthorizationController = self.applePaymentAuthorizationController {
            applePaymentAuthorizationController.delegate = self
            DispatchQueue.main.async {
                let vc = findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
                vc.present(
                    applePaymentAuthorizationController,
                    animated: true,
                    completion: nil
                )
            }
        } else {
            resolve(Errors.createError(ErrorType.Failed, "Invalid in-app payment request. Search the iOS logs for `NSUnderlyingError` to get more information."))
        }
    }
    
    @objc(dismissPlatformPay:rejecter:)
    func dismissPlatformPay(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let didDismiss = maybeDismissApplePay()
        resolve(didDismiss)
    }
    
    @objc(confirmPlatformPay:params:isPaymentIntent:resolver:rejecter:)
    func confirmPlatformPay(
        clientSecret: String?,
        params: NSDictionary,
        isPaymentIntent: Bool,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let applePayPatams = params["applePay"] as? NSDictionary else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide the `applePay` parameter."))
            return
        }
        let (error, paymentRequest) = ApplePayUtils.createPaymentRequest(merchantIdentifier: merchantIdentifier, params: applePayPatams)
        guard let paymentRequest = paymentRequest else {
            resolve(error)
            return
        }

        self.applePaySummaryItems = paymentRequest.paymentSummaryItems
        self.applePayShippingMethods = paymentRequest.shippingMethods ?? []
        self.applePayShippingAddressErrors = nil
        self.applePayCouponCodeErrors = nil
        self.confirmApplePayResolver = resolve
        if (isPaymentIntent) {
            self.confirmApplePayPaymentClientSecret = clientSecret
        } else {
            self.confirmApplePaySetupClientSecret = clientSecret
        }
        if let applePayContext = STPApplePayContext(paymentRequest: paymentRequest, delegate: self) {
            DispatchQueue.main.async {
                applePayContext.presentApplePay(completion: nil)
            }
        } else {
            resolve(Errors.createError(ErrorType.Failed, "Payment not completed"))
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
                } else {
                    resolve(
                        Mappers.createResult("paymentMethod", Mappers.mapFromPaymentMethod(paymentMethod))
                    )
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
        let address = params["address"] as? NSDictionary
        let cardSourceParams = STPCardParams()
        if let params = cardFieldView?.cardParams as? STPPaymentMethodParams {
            cardSourceParams.number = params.card!.number
            cardSourceParams.cvc = params.card!.cvc
            cardSourceParams.expMonth = UInt(truncating: params.card!.expMonth ?? 0)
            cardSourceParams.expYear = UInt(truncating: params.card!.expYear ?? 0)
        } else if let params = cardFormView?.cardParams as? STPPaymentMethodCardParams {
            cardSourceParams.number = params.number
            cardSourceParams.cvc = params.cvc
            cardSourceParams.expMonth = UInt(truncating: params.expMonth ?? 0)
            cardSourceParams.expYear = UInt(truncating: params.expYear ?? 0)
        } else {
            resolve(Errors.createError(ErrorType.Failed, "Card details not complete"))
            return
        }
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

    @objc(handleNextAction:returnURL:resolver:rejecter:)
    func handleNextAction(
        paymentIntentClientSecret: String,
        returnURL: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ){
        let paymentHandler = STPPaymentHandler.shared()
        paymentHandler.handleNextAction(forPayment: paymentIntentClientSecret, with: self, returnURL: returnURL) { status, paymentIntent, handleActionError in
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

        let connectionsReturnURL: String?
        if let urlScheme = urlScheme {
            connectionsReturnURL = Mappers.mapToFinancialConnectionsReturnURL(urlScheme: urlScheme)
        } else {
          connectionsReturnURL = nil
        }

        if (isPaymentIntent) {
            DispatchQueue.main.async {
                STPBankAccountCollector().collectBankAccountForPayment(
                    clientSecret: clientSecret as String,
                    returnURL: connectionsReturnURL,
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
                        } else {
                            resolve(
                                Mappers.createResult("paymentIntent", Mappers.mapFromPaymentIntent(paymentIntent: intent))
                            )
                        }
                    } else {
                        resolve(Errors.createError(ErrorType.Unknown, "There was unexpected error while collecting bank account information."))
                    }
                }
            }
        } else {
            DispatchQueue.main.async {
                STPBankAccountCollector().collectBankAccountForSetup(
                    clientSecret: clientSecret as String,
                    returnURL: connectionsReturnURL,
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
                        } else {
                            resolve(
                                Mappers.createResult("setupIntent", Mappers.mapFromSetupIntent(setupIntent: intent))
                            )
                        }
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
        params: NSDictionary?,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        self.confirmPaymentResolver = resolve
        self.confirmPaymentClientSecret = paymentIntentClientSecret

        let paymentMethodData = params?["paymentMethodData"] as? NSDictionary
        let (missingPaymentMethodError, paymentMethodType) = getPaymentMethodType(params: params)
        if (missingPaymentMethodError != nil) {
            resolve(missingPaymentMethodError)
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

    func getPaymentMethodType(
        params: NSDictionary?
    ) -> (NSDictionary?, STPPaymentMethodType?) {
        if let params = params {
            guard let paymentMethodType = Mappers.mapToPaymentMethodType(type: params["paymentMethodType"] as? String) else {
                return (Errors.createError(ErrorType.Failed, "You must provide paymentMethodType"), nil)
            }
            return (nil, paymentMethodType)
        } else {
            // If params aren't provided, it means we expect that the payment method was attached on the server side
            return (nil, nil)
        }
    }

    func createPaymentIntentParams(
        paymentIntentClientSecret: String,
        paymentMethodType: STPPaymentMethodType?,
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
                guard let paymentMethodType = paymentMethodType else { return STPPaymentIntentParams(clientSecret: paymentIntentClientSecret) }

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

    @objc(canAddCardToWallet:resolver:rejecter:)
    func canAddCardToWallet(
        params: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        guard let last4 = params["cardLastFour"] as? String else {
            resolve(Errors.createError(ErrorType.Failed, "You must provide `cardLastFour`"))
            return
        }
        PushProvisioningUtils.canAddCardToWallet(
            last4: last4,
            primaryAccountIdentifier: params["primaryAccountIdentifier"] as? String ?? "",
            testEnv: params["testEnv"] as? Bool ?? false,
            hasPairedAppleWatch: params["hasPairedAppleWatch"]  as? Bool ?? false)
        { canAddCard, status in
            resolve([
                "canAddCard": canAddCard,
                "details": ["status": status?.rawValue],
            ])
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
        resolve(["isInWallet": PushProvisioningUtils.getPassLocation(last4: last4) != nil])
    }

    @objc(collectBankAccountToken:resolver:rejecter:)
    func collectBankAccountToken(
        clientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        if (STPAPIClient.shared.publishableKey == nil) {
            resolve(Errors.MISSING_INIT_ERROR)
            return
        }
        let returnURL: String?
        if let urlScheme = urlScheme {
            returnURL = Mappers.mapToFinancialConnectionsReturnURL(urlScheme: urlScheme)
        } else {
          returnURL = nil
        }
        FinancialConnections.presentForToken(withClientSecret: clientSecret, returnURL: returnURL, resolve: resolve)
    }

    @objc(collectFinancialConnectionsAccounts:resolver:rejecter:)
    func collectFinancialConnectionsAccounts(
        clientSecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        if (STPAPIClient.shared.publishableKey == nil) {
            resolve(Errors.MISSING_INIT_ERROR)
            return
        }
        let returnURL: String?
        if let urlScheme = urlScheme {
            returnURL = Mappers.mapToFinancialConnectionsReturnURL(urlScheme: urlScheme)
        } else {
          returnURL = nil
        }
        FinancialConnections.present(withClientSecret: clientSecret, returnURL: returnURL, resolve: resolve)
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
