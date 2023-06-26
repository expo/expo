//
//  ApplePayUtils.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 6/27/22.
//

import Foundation
import StripePaymentSheet

class ApplePayUtils {
    
    internal class func createPaymentRequest(
        merchantIdentifier: String?,
        params: NSDictionary
    ) -> (error: NSDictionary?, paymentRequest: PKPaymentRequest?) {
        guard let merchantIdentifier = merchantIdentifier else {
            return (Errors.createError(ErrorType.Failed, "You must provide merchantIdentifier"), nil)
        }

        if let additionalEnabledNetworks = params["additionalEnabledNetworks"] as? [String] {
            StripeAPI.additionalEnabledApplePayNetworks = ApplePayUtils.mapToArrayOfPaymentNetworks(arrayOfStrings: additionalEnabledNetworks)
        } else if (params["jcbEnabled"] as? Bool == true) {
            StripeAPI.additionalEnabledApplePayNetworks = [.JCB]
        }

        guard let summaryItems = params["cartItems"] as? NSArray else {
            return (Errors.createError(ErrorType.Failed, "`cartItems` cannot be null."), nil)
        }
        if (summaryItems.count == 0) {
            return (Errors.createError(ErrorType.Failed, "`cartItems` cannot be empty."), nil)
        }
        
        guard let countryCode = ((params.object(forKey: "merchantCountryCode") != nil) ? params["merchantCountryCode"] : params["country"]) as? String else {
            return (Errors.createError(ErrorType.Failed, "You must provide the country"), nil)
        }
        guard let currencyCode = ((params.object(forKey: "currencyCode") != nil) ? params["currencyCode"] : params["currency"]) as? String else {
            return (Errors.createError(ErrorType.Failed, "You must provide the payment currency"), nil)
        }

        let paymentRequest = StripeAPI.paymentRequest(withMerchantIdentifier: merchantIdentifier, country: countryCode, currency: currencyCode)

        let requiredShippingAddressFields = params["requiredShippingAddressFields"] as? NSArray ?? NSArray()
        let requiredBillingContactFields = params["requiredBillingContactFields"] as? NSArray ?? NSArray()
        let shippingMethods = params["shippingMethods"] as? NSArray ?? NSArray()

        paymentRequest.requiredShippingContactFields = Set(requiredShippingAddressFields.map {
            Mappers.mapToPKContactField(field: $0 as! String)
        })

        paymentRequest.requiredBillingContactFields = Set(requiredBillingContactFields.map {
            Mappers.mapToPKContactField(field: $0 as! String)
        })

        paymentRequest.shippingMethods = ApplePayUtils.buildShippingMethods(items: shippingMethods as? [[String : Any]])

        do {
            paymentRequest.paymentSummaryItems = try ApplePayUtils
                .buildPaymentSummaryItems(items: summaryItems as? [[String : Any]])
        } catch {
            return (Errors.createError(ErrorType.Failed, error.localizedDescription), nil)
        }
        
        if let capabilities = params["merchantCapabilities"] as? [String] {
            for capability in capabilities {
                paymentRequest.merchantCapabilities.update(with: ApplePayUtils.getMerchantCapabilityFrom(string: capability))
            }
        }
        
        paymentRequest.shippingType = ApplePayUtils.getShippingTypeFrom(string: params["shippingType"] as? String)
        if let supportedCountries = params["supportedCountries"] as? Set<String> {
            paymentRequest.supportedCountries = supportedCountries
        }
        if #available(iOS 15.0, *) {
            if (params["supportsCouponCode"] as? Bool == true) {
                paymentRequest.supportsCouponCode = true
            }
            if let couponCode = params["couponCode"] as? String {
                paymentRequest.supportsCouponCode = true
                paymentRequest.couponCode = couponCode
            }
        }

        do {
            try paymentRequest.configureRequestType(requestParams: params["request"] as? NSDictionary)
        } catch {
            return (Errors.createError(ErrorType.Failed, error.localizedDescription), nil)
        }

        return (nil, paymentRequest)
    }
    
#if compiler(>=5.7)
    @available(iOS 16.0, *)
    internal class func buildRecurringPaymentRequest(params: NSDictionary) throws -> PKRecurringPaymentRequest {
        guard let description = params["description"] as? String else {
            throw ApplePayUtilsError.missingParameter(nil, "description")
        }
        guard let urlString = params["managementUrl"] as? String else {
            throw ApplePayUtilsError.missingParameter(nil, "managementUrl")
        }
        guard let url = URL(string: urlString) else {
            throw ApplePayUtilsError.invalidUrl(urlString)
        }
        let regularBilling = try ApplePayUtils.createRecurringPaymentSummaryItem(item: params["billing"] as? [String : Any] ?? [:])
        let request = PKRecurringPaymentRequest(paymentDescription: description, regularBilling: regularBilling, managementURL: url)
        if let trialParams = params["trialBilling"] as? [String : Any] {
            request.trialBilling = try ApplePayUtils.createRecurringPaymentSummaryItem(item: trialParams)
        }
        if let tokenNotificationURL = params["tokenNotificationURL"] as? String {
            request.tokenNotificationURL = URL(string: tokenNotificationURL)
        }
        request.billingAgreement = params["billingAgreement"] as? String
        return request
    }
    
    @available(iOS 16.0, *)
    internal class func buildAutomaticReloadPaymentRequest(params: NSDictionary) throws -> PKAutomaticReloadPaymentRequest {
        guard let description = params["description"] as? String else {
            throw ApplePayUtilsError.missingParameter(nil, "description")
        }
        guard let urlString = params["managementUrl"] as? String else {
            throw ApplePayUtilsError.missingParameter(nil, "managementUrl")
        }
        guard let url = URL(string: urlString) else {
            throw ApplePayUtilsError.invalidUrl(urlString)
        }
        let automaticReloadBilling = PKAutomaticReloadPaymentSummaryItem.init(label: params["label"] as? String ?? "", amount: NSDecimalNumber(string: params["reloadAmount"] as? String ?? ""))
        guard let threshold = params["thresholdAmount"] as? String else {
            throw ApplePayUtilsError.missingParameter(nil, "thresholdAmount")
        }
        automaticReloadBilling.thresholdAmount = NSDecimalNumber(string: threshold)
        let request = PKAutomaticReloadPaymentRequest(paymentDescription: description, automaticReloadBilling: automaticReloadBilling, managementURL: url)
        if let tokenNotificationURL = params["tokenNotificationURL"] as? String {
            request.tokenNotificationURL = URL(string: tokenNotificationURL)
        }
        request.billingAgreement = params["billingAgreement"] as? String
        return request
    }
    
    @available(iOS 16.0, *)
    internal class func buildPaymentTokenContexts(items: [[String : Any]]) -> [PKPaymentTokenContext] {
        var result: [PKPaymentTokenContext] = []
        for item in items {
            let context = PKPaymentTokenContext.init(merchantIdentifier: item["merchantIdentifier"] as? String ?? "",
                                                     externalIdentifier: item["externalIdentifier"] as? String ?? "",
                                                     merchantName: item["merchantName"] as? String ?? "",
                                                     merchantDomain: item["merchantDomain"] as? String,
                                                     amount: NSDecimalNumber(string: item["thresholdAmount"] as? String ?? ""))
            result.append(context)
        }
        return result
    }
#endif
    
    internal class func getMerchantCapabilityFrom(string: String?) -> PKMerchantCapability {
        switch string {
        case "supportsDebit":
            return .capabilityDebit
        case "supportsCredit":
            return .capabilityCredit
        case "supportsEMV":
            return .capabilityEMV
        case "supports3DS":
            fallthrough
        default:
            return .capability3DS
        }
    }
    
    internal class func getShippingTypeFrom(string: String?) -> PKShippingType {
        switch string {
        case "delivery":
            return .delivery
        case "storePickup":
            return .storePickup
        case "servicePickup":
            return .servicePickup
        case "shipping":
            fallthrough
        default:
            return .shipping
        }
    }
    
    @available(iOS 15.0, *)
    internal class func createDeferredPaymentSummaryItem(item: [String : Any]) throws -> PKDeferredPaymentSummaryItem {
        let label = item["label"] as? String ?? ""
        let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
        
        let deferredItem = PKDeferredPaymentSummaryItem(
            label: label,
            amount: amount
        )
        guard let date = item["deferredDate"] as? Double else {
            throw ApplePayUtilsError.missingParameter(label, "deferredDate")
        }
        deferredItem.deferredDate = Date(timeIntervalSince1970: date)
        return deferredItem
    }
    
    @available(iOS 15.0, *)
    internal class func createRecurringPaymentSummaryItem(item: [String : Any]) throws -> PKRecurringPaymentSummaryItem {
        let label = item["label"] as? String ?? ""
        let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
        
        let recurringItem = PKRecurringPaymentSummaryItem(
            label: label,
            amount: amount
        )
        guard let intervalCount = item["intervalCount"] as? Int else {
            throw ApplePayUtilsError.missingParameter(label, "intervalCount")
        }
        recurringItem.intervalCount = intervalCount
        recurringItem.intervalUnit = try mapToIntervalUnit(intervalString: item["intervalUnit"] as? String)
        if let startDate = item["startDate"] as? Double {
            recurringItem.startDate = Date(timeIntervalSince1970: startDate)
        }
        if let endDate = item["endDate"] as? Double {
            recurringItem.endDate = Date(timeIntervalSince1970: endDate)
        }
        return recurringItem
    }
    
    internal class func mapToIntervalUnit(intervalString: String?) throws -> NSCalendar.Unit {
        switch intervalString {
        case "minute":
            return NSCalendar.Unit.minute
        case "hour":
            return NSCalendar.Unit.hour
        case "day":
            return NSCalendar.Unit.day
        case "month":
            return NSCalendar.Unit.month
        case "year":
            return NSCalendar.Unit.year
        default:
            throw ApplePayUtilsError.invalidTimeInterval(intervalString ?? "null")
        }
    }
    
    internal class func createImmediatePaymentSummaryItem(item: [String : Any]) -> PKPaymentSummaryItem {
        let label = item["label"] as? String ?? ""
        let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
        
        return PKPaymentSummaryItem(
            label: label,
            amount: amount,
            type: item["isPending"] as? Bool ?? false ?
                PKPaymentSummaryItemType.pending : PKPaymentSummaryItemType.final
        )
    }
    
    public class func buildPaymentSummaryItems(items: [[String : Any]]?) throws -> [PKPaymentSummaryItem] {
        var paymentSummaryItems: [PKPaymentSummaryItem] = []
        if let items = items {
            for item in items {
                let paymentSummaryItem = try buildPaymentSummaryItem(item: item)
                paymentSummaryItems.append(paymentSummaryItem)
            }
        }
        
        return paymentSummaryItems
    }
    
    internal class func buildPaymentSummaryItem(item: [String : Any]) throws -> PKPaymentSummaryItem {
        switch item["paymentType"] as? String {
        case "Deferred":
            if #available(iOS 15.0, *) {
                return try createDeferredPaymentSummaryItem(item: item)
            } else {
                return createImmediatePaymentSummaryItem(item: item)
            }
        case "Recurring":
            if #available(iOS 15.0, *) {
                return try createRecurringPaymentSummaryItem(item: item)
            } else {
                return createImmediatePaymentSummaryItem(item: item)
            }
        case "Immediate":
            return createImmediatePaymentSummaryItem(item: item)
        default:
            throw ApplePayUtilsError.invalidCartSummaryItemType(item["paymentType"] as? String ?? "null")
        }
    }
    
    public class func buildShippingMethods(items: [[String : Any]]?) -> [PKShippingMethod] {
        var shippingMethods: [PKShippingMethod] = []
        if let items = items {
            for item in items {
                let shippingMethod = buildShippingMethod(item: item)
                shippingMethods.append(shippingMethod)
            }
        }
        
        return shippingMethods
    }
    
    internal class func buildShippingMethod(item: [String : Any]) -> PKShippingMethod {
        let label = item["label"] as? String ?? ""
        let amount = NSDecimalNumber(string: item["amount"] as? String ?? "")
        let shippingMethod = PKShippingMethod(
            label: label,
            amount: amount,
            type: item["isPending"] as? Bool ?? false
                ? PKPaymentSummaryItemType.pending : PKPaymentSummaryItemType.final
        )
        shippingMethod.detail = item["detail"] as? String ?? ""
        shippingMethod.identifier = item["identifier"] as? String ?? ""
        if #available(iOS 15.0, *) {
            if let startDate = item["startDate"] as? Double, let endDate = item["endDate"] as? Double {
                let startDate = Date(timeIntervalSince1970: startDate)
                let endDate = Date(timeIntervalSince1970: endDate)
                shippingMethod.dateComponentsRange = PKDateComponentsRange(
                    start: Calendar.current.dateComponents([.calendar, .year, .month, .day],
                                                           from: startDate),
                    end: Calendar.current.dateComponents([.calendar, .year, .month, .day],
                                                         from: endDate)
                )
            }
        }
        return shippingMethod
    }
    
    public class func buildApplePayErrors(errorItems: [NSDictionary]) throws -> (shippingAddressErrors: [Error], couponCodeErrors: [Error]) {
        var shippingAddressErrors: [Error] = []
        var couponCodeErrors: [Error] = []
        
        for item in errorItems {
            let type = item["errorType"] as? String
            let message = item["message"] as? String
            switch type {
            case "InvalidShippingAddress":
                let field = item["field"] as? String ?? "street"
                shippingAddressErrors.append(PKPaymentRequest.paymentShippingAddressInvalidError(withKey: field, localizedDescription: message))
            case "UnserviceableShippingAddress":
                shippingAddressErrors.append(PKPaymentRequest.paymentShippingAddressUnserviceableError(withLocalizedDescription: message))
            case "ExpiredCouponCode":
                if #available(iOS 15.0, *) {
                    couponCodeErrors.append(PKPaymentRequest.paymentCouponCodeExpiredError(localizedDescription: message))
                }
            case "InvalidCouponCode":
                if #available(iOS 15.0, *) {
                    couponCodeErrors.append(PKPaymentRequest.paymentCouponCodeInvalidError(localizedDescription: message))
                }
            default:
                throw ApplePayUtilsError.invalidErrorType(String(describing: type))
            }
        }
        return (shippingAddressErrors, couponCodeErrors)
    }
    
    internal class func mapToArrayOfPaymentNetworks(arrayOfStrings: [String]) -> [PKPaymentNetwork] {
        let validNetworks: [PKPaymentNetwork?] = arrayOfStrings.map { networkString in
            return PKPaymentNetwork.init(rawValue: networkString)
        }
        return validNetworks.compactMap { $0 }
    }
    
    public class func buildPaymentSheetApplePayConfig(
        merchantIdentifier: String?,
        merchantCountryCode: String?,
        paymentSummaryItems: [[String : Any]]?,
        buttonType: NSNumber?,
        customHandlers: PaymentSheet.ApplePayConfiguration.Handlers?
    ) throws -> PaymentSheet.ApplePayConfiguration {
        guard let merchantId = merchantIdentifier else {
            throw ApplePayUtilsError.missingMerchantId
        }
        guard let countryCode = merchantCountryCode else {
            throw ApplePayUtilsError.missingCountryCode
        }
        let paymentSummaryItems = try ApplePayUtils.buildPaymentSummaryItems(
            items: paymentSummaryItems
        )
        
        return PaymentSheet.ApplePayConfiguration.init(
            merchantId: merchantId,
            merchantCountryCode: countryCode,
            buttonType: PKPaymentButtonType(rawValue: buttonType as? Int ?? 0) ?? .plain,
            paymentSummaryItems: paymentSummaryItems.count > 0 ? paymentSummaryItems : nil,
            customHandlers: customHandlers
        )
    }
}

enum ApplePayUtilsError : Error, Equatable {
    case invalidCartSummaryItemType(String)
    case missingParameter(String?, String)
    case invalidTimeInterval(String)
    case invalidPaymentNetwork(String)
    case invalidErrorType(String)
    case invalidUrl(String)
    case invalidRequestType(String)
    case missingMerchantId
    case missingCountryCode
}
    
extension ApplePayUtilsError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .invalidCartSummaryItemType(let type):
            return "Failed to ceate Apple Pay summary item. Expected `type` to be one of 'Immediate', 'Recurring', or 'Deferred', but received: \(type)"
        case .missingParameter(let label, let parameter):
            if let label = label {
                return "Failed to create Apple Pay summary item with label: \(label). The \(parameter) item parameter is required, but none was provided."
            } else {
                return "The \(parameter) item parameter is required, but none was provided."
            }
        case .invalidTimeInterval(let providedInterval):
            return "Failed to create Apple Pay summary item. \(providedInterval) is not a valid timeInterval, must be one of: minute, hour, day, month, or year."
        case .invalidPaymentNetwork(let network):
            return "Failed to create Apple Pay summary item. \(network) is not a valid/supported payment network."
        case .invalidErrorType(let type):
            return "Error type: '\(type)' is not supported."
        case .missingMerchantId:
            return "`merchantIdentifier` is required, but none was found. Ensure you are passing this to initStripe your StripeProvider."
        case .missingCountryCode:
            return "`merchantCountryCode` is a required param, but was not provided."
        case .invalidUrl(let url):
            return "Invalid URL: \(url)."
        case .invalidRequestType(let tyoe):
            return "Apple Pay request type `\(tyoe)` is not supported."
        }
    }
}

extension PKPaymentRequest {
    func configureRequestType(requestParams: NSDictionary?) throws -> Void {
#if compiler(>=5.7)
        if #available(iOS 16.0, *) {
            if let requestParams = requestParams {
                switch requestParams["type"] as? String {
                case "Recurring":
                    self.recurringPaymentRequest = try ApplePayUtils.buildRecurringPaymentRequest(params: requestParams)
                case "AutomaticReload":
                    self.automaticReloadPaymentRequest = try ApplePayUtils.buildAutomaticReloadPaymentRequest(params: requestParams)
                case "MultiMerchant":
                    self.multiTokenContexts = ApplePayUtils.buildPaymentTokenContexts(items: requestParams["merchants"] as? [[String : Any]] ?? [])
                default:
                    throw ApplePayUtilsError.invalidRequestType(String(describing: requestParams["type"]))
                }
            }
        }
#endif
    }
}
