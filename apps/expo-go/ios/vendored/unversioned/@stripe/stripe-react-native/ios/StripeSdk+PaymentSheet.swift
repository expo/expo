//
//  StripeSdk+PaymentSheet.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 1/6/23.
//

import Foundation
import StripePaymentSheet

extension StripeSdk {
    internal func buildPaymentSheetConfiguration(
            params: NSDictionary
    ) -> (error: NSDictionary?, configuration: PaymentSheet.Configuration?) {
        var configuration = PaymentSheet.Configuration()
        
        configuration.primaryButtonLabel = params["primaryButtonLabel"] as? String

        if let appearanceParams = params["appearance"] as? NSDictionary {
            do {
                configuration.appearance = try PaymentSheetAppearance.buildAppearanceFromParams(userParams: appearanceParams)
            } catch {
                return(error: Errors.createError(ErrorType.Failed, error.localizedDescription), configuration: nil)
            }
        }

        if let applePayParams = params["applePay"] as? NSDictionary {
            do {
                configuration.applePay = try ApplePayUtils.buildPaymentSheetApplePayConfig(
                    merchantIdentifier: self.merchantIdentifier,
                    merchantCountryCode: applePayParams["merchantCountryCode"] as? String,
                    paymentSummaryItems: applePayParams["cartItems"] as? [[String : Any]],
                    buttonType: applePayParams["buttonType"] as? NSNumber,
                    customHandlers: buildCustomerHandlersForPaymentSheet(applePayParams: applePayParams)
                )
            } catch {
                return(error: Errors.createError(ErrorType.Failed, error.localizedDescription), configuration: nil)
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
        
        if let removeSavedPaymentMethodMessage = params["removeSavedPaymentMethodMessage"] as? String {
            configuration.removeSavedPaymentMethodMessage = removeSavedPaymentMethodMessage
        }
        
        if let billingConfigParams = params["billingDetailsCollectionConfiguration"] as? [String: Any?] {
            configuration.billingDetailsCollectionConfiguration.name = StripeSdk.mapToCollectionMode(str: billingConfigParams["name"] as? String)
            configuration.billingDetailsCollectionConfiguration.phone = StripeSdk.mapToCollectionMode(str: billingConfigParams["phone"] as? String)
            configuration.billingDetailsCollectionConfiguration.email = StripeSdk.mapToCollectionMode(str: billingConfigParams["email"] as? String)
            configuration.billingDetailsCollectionConfiguration.address = StripeSdk.mapToAddressCollectionMode(str: billingConfigParams["address"] as? String)
            configuration.billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod = billingConfigParams["attachDefaultsToPaymentMethod"] as? Bool == true
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
        
        if #available(iOS 13.0, *) {
            if let style = params["style"] as? String {
                configuration.style = Mappers.mapToUserInterfaceStyle(style)
            }
        }
        
        if let customerId = params["customerId"] as? String {
            if let customerEphemeralKeySecret = params["customerEphemeralKeySecret"] as? String {
                if (!Errors.isEKClientSecretValid(clientSecret: customerEphemeralKeySecret)) {
                    return(error: Errors.createError(ErrorType.Failed, "`customerEphemeralKeySecret` format does not match expected client secret formatting."), configuration: nil)
                }
                configuration.customer = .init(id: customerId, ephemeralKeySecret: customerEphemeralKeySecret)
            }
        }
        
        return (nil, configuration)
    }
    
    internal func preparePaymentSheetInstance(
        params: NSDictionary,
        configuration: PaymentSheet.Configuration,
        resolve: @escaping RCTPromiseResolveBlock
    ) {
        self.paymentSheetFlowController = nil
        
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
            guard let intentConfiguration = params["intentConfiguration"] as? NSDictionary else {
                resolve(Errors.createError(ErrorType.Failed, "One of `paymentIntentClientSecret`, `setupIntentClientSecret`, or `intentConfiguration` is required"))
                return
            }
            guard let modeParams =  intentConfiguration["mode"] as? NSDictionary else {
                resolve(Errors.createError(ErrorType.Failed, "One of `paymentIntentClientSecret`, `setupIntentClientSecret`, or `intentConfiguration.mode` is required"))
                return
            }
            if (intentConfiguration.object(forKey: "confirmHandler") == nil) {
                resolve(Errors.createError(ErrorType.Failed, "You must provide `intentConfiguration.confirmHandler` if you are not passing an intent client secret"))
                return
            }
            let captureMethodString = intentConfiguration["captureMethod"] as? String
            let intentConfig = buildIntentConfiguration(
                modeParams: modeParams,
                paymentMethodTypes: intentConfiguration["paymentMethodTypes"] as? [String],
                captureMethod: mapCaptureMethod(captureMethodString)
            )
            
            if params["customFlow"] as? Bool == true {
                PaymentSheet.FlowController.create(intentConfiguration: intentConfig, configuration: configuration) { [weak self] result in
                    handlePaymentSheetFlowControllerResult(result: result, stripeSdk: self)
                }
            } else {
                self.paymentSheet = PaymentSheet(
                    intentConfiguration: intentConfig,
                    configuration: configuration
                )
                resolve([])
            }
        }
    }
    
    private func mapCaptureMethod(_ captureMethod: String?) -> PaymentSheet.IntentConfiguration.CaptureMethod {
        if let captureMethod = captureMethod {
            switch captureMethod {
            case "Automatic": return PaymentSheet.IntentConfiguration.CaptureMethod.automatic
            case "Manual": return PaymentSheet.IntentConfiguration.CaptureMethod.manual
            case "AutomaticAsync": return PaymentSheet.IntentConfiguration.CaptureMethod.automaticAsync
            default: return PaymentSheet.IntentConfiguration.CaptureMethod.automatic
            }
        }
        return PaymentSheet.IntentConfiguration.CaptureMethod.automatic
    }
    
    private func buildIntentConfiguration(
        modeParams: NSDictionary,
        paymentMethodTypes: [String]?,
        captureMethod: PaymentSheet.IntentConfiguration.CaptureMethod
    ) -> PaymentSheet.IntentConfiguration {
        var mode: PaymentSheet.IntentConfiguration.Mode
        if let amount = modeParams["amount"] as? Int {
            mode = PaymentSheet.IntentConfiguration.Mode.payment(
                amount: amount,
                currency: modeParams["currencyCode"] as? String ?? "",
                setupFutureUsage: modeParams["setupFutureUsage"] != nil
                    ? (modeParams["setupFutureUsage"] as? String == "OffSession" ? .offSession : .onSession)
                    : nil,
            captureMethod: captureMethod
            )
        } else {
            mode = PaymentSheet.IntentConfiguration.Mode.setup(
                currency: modeParams["currencyCode"] as? String,
                setupFutureUsage: modeParams["setupFutureUsage"] as? String == "OffSession" ? .offSession : .onSession
            )
        }

        return PaymentSheet.IntentConfiguration.init(
            mode: mode,
            paymentMethodTypes: paymentMethodTypes,
            confirmHandler: { paymentMethod, shouldSavePaymentMethod, intentCreationCallback in
                if (self.hasEventListeners) {
                    self.paymentSheetIntentCreationCallback = intentCreationCallback
                    self.sendEvent(withName: "onConfirmHandlerCallback", body: [
                        "paymentMethod": Mappers.mapFromPaymentMethod(paymentMethod) ?? NSNull(),
                        "shouldSavePaymentMethod": shouldSavePaymentMethod
                    ])
                } else {
                    RCTMakeAndLogError("Tried to call confirmHandler, but no callback was found. Please file an issue: https://github.com/stripe/stripe-react-native/issues", nil, nil)
                }
            })
    }
    
    private func buildCustomerHandlersForPaymentSheet(applePayParams: NSDictionary) -> PaymentSheet.ApplePayConfiguration.Handlers? {
        if (applePayParams["request"] == nil) {
            return nil
        }
        return PaymentSheet.ApplePayConfiguration.Handlers(paymentRequestHandler: { request in
            do {
                try request.configureRequestType(requestParams: applePayParams)
            } catch {
                // At this point, we can't resolve a promise with an error object, so our best option is to create a redbox error
                RCTMakeAndLogError(error.localizedDescription, nil, nil)
            }
            return request
        }, authorizationResultHandler: { result, completion in
            if applePayParams.object(forKey: "setOrderTracking") != nil {
                if (self.hasEventListeners) {
                    self.orderTrackingHandler = (result, completion)
                    self.sendEvent(withName: "onOrderTrackingCallback", body: [:])
                } else {
                    RCTMakeAndLogError("Order tracking is enabled, but no callback was found. Please file an issue: https://github.com/stripe/stripe-react-native/issues", nil, nil)
                }
            } else {
                completion(result)
            }
        })
    }
    
    internal static func mapToCollectionMode(str: String?) -> PaymentSheet.BillingDetailsCollectionConfiguration.CollectionMode {
        switch str {
        case "automatic":
            return .automatic
        case "never":
            return .never
        case "always":
            return .always
        default:
            return .automatic
        }
    }
    
    internal static func mapToAddressCollectionMode(str: String?) -> PaymentSheet.BillingDetailsCollectionConfiguration.AddressCollectionMode {
        switch str {
        case "automatic":
            return .automatic
        case "never":
            return .never
        case "full":
            return .full
        default:
            return .automatic
        }
    }
}

