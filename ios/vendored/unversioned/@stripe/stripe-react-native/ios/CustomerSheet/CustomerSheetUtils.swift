//
//  CustomerSheetUtils.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 08/28/23.
//

import Foundation
@_spi(PrivateBetaCustomerSheet) import StripePaymentSheet

class CustomerSheetUtils {
    internal class func buildCustomerSheetConfiguration(
        appearance: PaymentSheet.Appearance,
        style: PaymentSheet.UserInterfaceStyle,
        removeSavedPaymentMethodMessage: String?,
        returnURL: String?,
        headerTextForSelectionScreen: String?,
        applePayEnabled: Bool?,
        merchantDisplayName: String?,
        billingDetailsCollectionConfiguration: NSDictionary?,
        defaultBillingDetails: NSDictionary?
    ) -> CustomerSheet.Configuration {
        var config = CustomerSheet.Configuration()
        config.appearance = appearance
        config.style = style
        config.removeSavedPaymentMethodMessage = removeSavedPaymentMethodMessage
        config.returnURL = returnURL
        config.headerTextForSelectionScreen = headerTextForSelectionScreen
        config.applePayEnabled = applePayEnabled ?? false
        if let merchantDisplayName = merchantDisplayName {
            config.merchantDisplayName = merchantDisplayName
        }
        if let billingConfigParams = billingDetailsCollectionConfiguration {
            config.billingDetailsCollectionConfiguration.name = StripeSdk.mapToCollectionMode(str: billingConfigParams["name"] as? String)
            config.billingDetailsCollectionConfiguration.phone = StripeSdk.mapToCollectionMode(str: billingConfigParams["phone"] as? String)
            config.billingDetailsCollectionConfiguration.email = StripeSdk.mapToCollectionMode(str: billingConfigParams["email"] as? String)
            config.billingDetailsCollectionConfiguration.address = StripeSdk.mapToAddressCollectionMode(str: billingConfigParams["address"] as? String)
            config.billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod = billingConfigParams["attachDefaultsToPaymentMethod"] as? Bool == true
        }
        if let defaultBillingDetails = defaultBillingDetails {
            config.defaultBillingDetails.name = defaultBillingDetails["name"] as? String
            config.defaultBillingDetails.email = defaultBillingDetails["email"] as? String
            config.defaultBillingDetails.phone = defaultBillingDetails["phone"] as? String
            if let address = defaultBillingDetails["address"] as? [String: String] {
                config.defaultBillingDetails.address = .init(city: address["city"],
                                                          country: address["country"],
                                                            line1: address["line1"],
                                                            line2: address["line2"],
                                                       postalCode: address["postalCode"],
                                                            state: address["state"])
            }
        }
        return config
    }
    
    internal class func buildStripeCustomerAdapter(
        customerId: String,
        ephemeralKeySecret: String,
        setupIntentClientSecret: String?,
        customerAdapter: NSDictionary,
        stripeSdk: StripeSdk
    ) -> StripeCustomerAdapter {
        if (customerAdapter.count > 0) {
            return buildCustomerAdapterOverride(
                customerAdapter: customerAdapter,
                customerId: customerId,
                ephemeralKeySecret: ephemeralKeySecret,
                setupIntentClientSecret: setupIntentClientSecret,
                stripeSdk: stripeSdk
            )
        }
        
        if let setupIntentClientSecret = setupIntentClientSecret {
            return StripeCustomerAdapter(
                customerEphemeralKeyProvider: {
                    return CustomerEphemeralKey(customerId: customerId, ephemeralKeySecret: ephemeralKeySecret)
                },
                setupIntentClientSecretProvider: {
                    return setupIntentClientSecret
                }
            )
        }

        return StripeCustomerAdapter(
            customerEphemeralKeyProvider: {
                return CustomerEphemeralKey(customerId: customerId, ephemeralKeySecret: ephemeralKeySecret)
            }
        )
    }
    
    internal class func buildCustomerAdapterOverride(
        customerAdapter: NSDictionary,
        customerId: String,
        ephemeralKeySecret: String,
        setupIntentClientSecret: String?,
        stripeSdk: StripeSdk
    ) -> StripeCustomerAdapter {
        return ReactNativeCustomerAdapter(
            fetchPaymentMethods: customerAdapter["fetchPaymentMethods"] as? Bool ?? false,
            attachPaymentMethod: customerAdapter["attachPaymentMethod"] as? Bool ?? false,
            detachPaymentMethod: customerAdapter["detachPaymentMethod"] as? Bool ?? false,
            setSelectedPaymentOption: customerAdapter["setSelectedPaymentOption"] as? Bool ?? false,
            fetchSelectedPaymentOption: customerAdapter["fetchSelectedPaymentOption"] as? Bool ?? false,
            setupIntentClientSecretForCustomerAttach: customerAdapter["setupIntentClientSecretForCustomerAttach"] as? Bool ?? false,
            customerId: customerId,
            ephemeralKeySecret: ephemeralKeySecret,
            setupIntentClientSecret: setupIntentClientSecret,
            stripeSdk: stripeSdk
        )
    }

    internal class func getModalPresentationStyle(_ string: String?) -> UIModalPresentationStyle {
        switch (string) {
        case "fullscreen":
            return .fullScreen
        case "pageSheet":
            return .pageSheet
        case "formSheet":
            return .formSheet
        case "automatic":
            return .automatic
        case "overFullScreen":
            return .overFullScreen
        case "popover":
            fallthrough
        default:
            return .popover
        }
    }

    internal class func getModalTransitionStyle(_ string: String?) -> UIModalTransitionStyle {
        switch (string) {
        case "flip":
            return .flipHorizontal
        case "curl":
            return .partialCurl
        case "dissolve":
            return .crossDissolve
        case "slide":
            fallthrough
        default:
            return .coverVertical
        }
    }

    
    internal class func buildPaymentOptionResult(label: String, imageData: String?, paymentMethod: STPPaymentMethod?) -> NSMutableDictionary {
        let result: NSMutableDictionary = [:]
        let paymentOption: NSMutableDictionary = [:]
        paymentOption.setValue(label, forKey: "label")
        if (imageData != nil) {
            paymentOption.setValue(imageData, forKey: "image")
        }
        result.setValue(paymentOption, forKey: "paymentOption")
        if (paymentMethod != nil) {
            result.setValue(Mappers.mapFromPaymentMethod(paymentMethod), forKey: "paymentMethod")
        }
        return result
    }
    
    internal class func interpretResult(result: CustomerSheet.CustomerSheetResult) -> NSDictionary {
        var payload: NSMutableDictionary = [:]
        switch result {
        case .error(let error):
            return Errors.createError(ErrorType.Failed, error as NSError)
        case .selected(let paymentOption):
            switch paymentOption {
            case .applePay(let paymentOptionDisplayData):
                payload = CustomerSheetUtils.buildPaymentOptionResult(label: paymentOptionDisplayData.label, imageData: paymentOptionDisplayData.image.pngData()?.base64EncodedString(), paymentMethod: nil)
            case .paymentMethod(let paymentMethod, let paymentOptionDisplayData):
                payload = CustomerSheetUtils.buildPaymentOptionResult(label: paymentOptionDisplayData.label, imageData: paymentOptionDisplayData.image.pngData()?.base64EncodedString(), paymentMethod: paymentMethod)
            case .none:
                break
            }
        case .canceled(let paymentOption):
            switch paymentOption {
            case .applePay(let paymentOptionDisplayData):
                payload = CustomerSheetUtils.buildPaymentOptionResult(label: paymentOptionDisplayData.label, imageData: paymentOptionDisplayData.image.pngData()?.base64EncodedString(), paymentMethod: nil)
            case .paymentMethod(let paymentMethod, let paymentOptionDisplayData):
                payload = CustomerSheetUtils.buildPaymentOptionResult(label: paymentOptionDisplayData.label, imageData: paymentOptionDisplayData.image.pngData()?.base64EncodedString(), paymentMethod: paymentMethod)
            case .none:
                break
            }
            payload.setValue(["code": ErrorType.Canceled], forKey: "error")
        }
        return payload
    }

}
