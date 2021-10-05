import Stripe

class Mappers {
    class func createResult(_ key: String, _ value: NSDictionary?) -> NSDictionary {
        return [key: value ?? NSNull()]
    }
    
    class func mapToPKContactField(field: String) -> PKContactField {
        switch field {
        case "emailAddress": return PKContactField.emailAddress
        case "name": return PKContactField.name
        case "phoneNumber": return PKContactField.phoneNumber
        case "phoneticName": return PKContactField.phoneticName
        case "postalAddress": return PKContactField.postalAddress
        default: return PKContactField.name
        }
    }
    
    class func mapToPaymentSummaryItemType(type: String?) -> PKPaymentSummaryItemType {
        if let type = type {
            switch type {
            case "pending": return PKPaymentSummaryItemType.pending
            case "final": return PKPaymentSummaryItemType.final
            default: return PKPaymentSummaryItemType.final
            }
        }
        return PKPaymentSummaryItemType.final
    }
    
    class func mapFromBankAccountHolderType(_ type: STPBankAccountHolderType?) -> String? {
        if let type = type {
            switch type {
            case STPBankAccountHolderType.company: return "Company"
            case STPBankAccountHolderType.individual: return "Individual"
            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromBankAccountStatus(_ status: STPBankAccountStatus?) -> String? {
        if let status = status {
            switch status {
            case STPBankAccountStatus.errored: return "Errored"
            case STPBankAccountStatus.new: return "New"
            case STPBankAccountStatus.validated: return "Validated"
            case STPBankAccountStatus.verified: return "Verified"
            case STPBankAccountStatus.verificationFailed: return "VerificationFailed"
            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromBankAccount(_ bankAccount: STPBankAccount?) -> NSDictionary? {
        if (bankAccount == nil) {
            return nil
        }
        let result: NSDictionary = [
            "bankName": bankAccount?.bankName ?? NSNull(),
            "accountHolderName": bankAccount?.accountHolderName ?? NSNull(),
            "accountHolderType": mapFromBankAccountHolderType(bankAccount?.accountHolderType) ?? NSNull(),
            "country": bankAccount?.country ?? NSNull(),
            "currency": bankAccount?.currency ?? NSNull(),
            "routingNumber": bankAccount?.routingNumber ?? NSNull(),
            "status": mapFromBankAccountStatus(bankAccount?.status) ?? NSNull(),

        ]
        return result
    }
    
    class func mapFromCard(_ card: STPCard?) -> NSDictionary? {
        if (card == nil) {
            return nil
        }
        let cardMap: NSDictionary = [
            "brand": mapCardBrand(card?.brand) ?? NSNull(),
            "country": card?.country ?? NSNull(),
            "currency": card?.currency ?? NSNull(),
            "expMonth": card?.expMonth ?? NSNull(),
            "expYear": card?.expYear ?? NSNull(),
            "last4": card?.last4 ?? NSNull(),
            "funding": mapFromFunding(card?.funding) ?? NSNull(),
            "name": card?.name ?? NSNull(),
            "address": mapFromAddress(address: card?.address)
        ]
        return cardMap
    }
    
    class func mapFromAddress(address: STPAddress?) -> NSDictionary {
        let result: NSDictionary = [
            "city": address?.city ?? NSNull(),
            "postalCode": address?.postalCode ?? NSNull(),
            "country": address?.country ?? NSNull(),
            "line1": address?.line1 ?? NSNull(),
            "line2": address?.line2 ?? NSNull(),
            "state": address?.state ?? NSNull(),
        ]
        
        return result
    }
    
    class func mapToAddress(address: NSDictionary?) -> STPAddress {
        let result = STPAddress()
        result.city = address?["city"] as? String
        result.country = address?["country"] as? String
        result.line1 = address?["line1"] as? String
        result.line2 = address?["line2"] as? String
        result.postalCode = address?["postalCode"] as? String
        result.state = address?["state"] as? String
        
        return result
    }
    
    class func mapFromFunding(_ funding: STPCardFundingType?) -> String? {
        if let funding = funding {
            switch funding {
            case STPCardFundingType.credit: return "Credit"
            case STPCardFundingType.debit: return "Debit"
            case STPCardFundingType.prepaid: return "Prepaid"
            case STPCardFundingType.other: return "Unknown"

            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromTokenType(_ type: STPTokenType?) -> String? {
        if let type = type {
            switch type {
            case STPTokenType.PII: return "Pii"
            case STPTokenType.account: return "Account"
            case STPTokenType.bankAccount: return "BankAccount"
            case STPTokenType.card: return "Card"
            case STPTokenType.cvcUpdate: return "CvcUpdate"
            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromToken(token: STPToken) -> NSDictionary {
        let tokenMap: NSDictionary = [
            "id": token.tokenId,
            "bankAccount": mapFromBankAccount(token.bankAccount) ?? NSNull(),
            "created": convertDateToUnixTimestamp(date: token.created) ?? NSNull(),
            "card": mapFromCard(token.card) ?? NSNull(),
            "livemode": token.livemode,
            "type": mapFromTokenType(token.type) ?? NSNull(),
        ]
        
        return tokenMap
    }
    
    class func mapToShippingMethods(shippingMethods: NSArray?) -> [PKShippingMethod] {
        var shippingMethodsList: [PKShippingMethod] = []
        
        if let methods = shippingMethods as? [[String : Any]] {
            for method in methods {
                let label = method["label"] as? String ?? ""
                let amount = NSDecimalNumber(string: method["amount"] as? String ?? "")
                let identifier = method["identifier"] as! String
                let detail = method["detail"] as? String ?? ""
                let type = Mappers.mapToPaymentSummaryItemType(type: method["type"] as? String)
                let pm = PKShippingMethod.init(label: label, amount: amount, type: type)
                pm.identifier = identifier
                pm.detail = detail
                shippingMethodsList.append(pm)
            }
        }
        
        return shippingMethodsList
    }
    
    class func mapFromShippingMethod(shippingMethod: PKShippingMethod) -> NSDictionary {
        let method: NSDictionary = [
            "detail": shippingMethod.detail ?? "",
            "identifier": shippingMethod.identifier ?? "",
            "amount": shippingMethod.amount.stringValue,
            "type": shippingMethod.type,
            "label": shippingMethod.label
        ]
        
        return method
    }
    
    class func mapFromShippingContact(shippingContact: PKContact) -> NSDictionary {
        let name: NSDictionary = [
            "familyName": shippingContact.name?.familyName ?? "",
            "namePrefix": shippingContact.name?.namePrefix ?? "",
            "nameSuffix": shippingContact.name?.nameSuffix ?? "",
            "givenName": shippingContact.name?.givenName ?? "",
            "middleName": shippingContact.name?.middleName ?? "",
            "nickname": shippingContact.name?.nickname ?? "",
        ]
        let contact: NSDictionary = [
            "emailAddress": shippingContact.emailAddress ?? "",
            "phoneNumber": shippingContact.phoneNumber?.stringValue ?? "",
            "name": name,
            "postalAddress": [
                "city": shippingContact.postalAddress?.city,
                "country": shippingContact.postalAddress?.country,
                "postalCode": shippingContact.postalAddress?.postalCode,
                "state": shippingContact.postalAddress?.state,
                "street": shippingContact.postalAddress?.street,
                "isoCountryCode": shippingContact.postalAddress?.isoCountryCode,
                "subAdministrativeArea": shippingContact.postalAddress?.subAdministrativeArea,
                "subLocality": shippingContact.postalAddress?.subLocality,
            ],
        ]
        
        return contact
    }
    
    class func mapAddressFields(_ addressFields: [String]) -> [String] {
        return addressFields.map {
            if ($0 == "street") {
                return CNPostalAddressStreetKey
            } else if ($0 == "city") {
                return CNPostalAddressCityKey
            } else if ($0 == "subAdministrativeArea") {
                return CNPostalAddressSubAdministrativeAreaKey
            } else if ($0 == "state") {
                return CNPostalAddressStateKey
            } else if ($0 == "postalCode") {
                return CNPostalAddressPostalCodeKey
            } else if ($0 == "country") {
                return CNPostalAddressCountryKey
            } else if ($0 == "countryCode") {
                return CNPostalAddressISOCountryCodeKey
            } else if ($0 == "subLocality") {
                return CNPostalAddressSubLocalityKey
            }
            return ""
        }
    }
    
    class func mapIntentStatus(status: STPPaymentIntentStatus?) -> String {
        if let status = status {
            switch status {
            case STPPaymentIntentStatus.succeeded: return "Succeeded"
            case STPPaymentIntentStatus.requiresPaymentMethod: return "RequiresPaymentMethod"
            case STPPaymentIntentStatus.requiresConfirmation: return "RequiresConfirmation"
            case STPPaymentIntentStatus.canceled: return "Canceled"
            case STPPaymentIntentStatus.processing: return "Processing"
            case STPPaymentIntentStatus.requiresAction: return "RequiresAction"
            case STPPaymentIntentStatus.requiresCapture: return "RequiresCapture"
            default: return "Unknown"
            }
        }
        return "Unknown"
    }
    
    class func mapPaymentMethodType(type: STPPaymentMethodType) -> String {
        switch type {
        case STPPaymentMethodType.card: return "Card"
        case STPPaymentMethodType.alipay: return "Alipay"
        case STPPaymentMethodType.grabPay: return "GrabPay"
        case STPPaymentMethodType.iDEAL: return "Ideal"
        case STPPaymentMethodType.FPX: return "Fpx"
        case STPPaymentMethodType.cardPresent: return "CardPresent"
        case STPPaymentMethodType.SEPADebit: return "SepaDebit"
        case STPPaymentMethodType.AUBECSDebit: return "AuBecsDebit"
        case STPPaymentMethodType.bacsDebit: return "BacsDebit"
        case STPPaymentMethodType.giropay: return "Giropay"
        case STPPaymentMethodType.przelewy24: return "P24"
        case STPPaymentMethodType.EPS: return "Eps"
        case STPPaymentMethodType.bancontact: return "Bancontact"
        case STPPaymentMethodType.OXXO: return "Oxxo"
        case STPPaymentMethodType.sofort: return "Sofort"
        case STPPaymentMethodType.UPI: return "Upi"
        case STPPaymentMethodType.afterpayClearpay: return "AfterpayClearpay"
        case STPPaymentMethodType.unknown: return "Unknown"
        default: return "Unknown"
        }
    }
    
    class func mapToPaymentMethodType(type: String?) -> STPPaymentMethodType? {
        if let type = type {
            switch type {
            case "Card": return STPPaymentMethodType.card
            case "Alipay": return STPPaymentMethodType.alipay
            case "GrabPay": return STPPaymentMethodType.grabPay
            case "Ideal": return STPPaymentMethodType.iDEAL
            case "Fpx": return STPPaymentMethodType.FPX
            case "CardPresent": return STPPaymentMethodType.cardPresent
            case "SepaDebit": return STPPaymentMethodType.SEPADebit
            case "AuBecsDebit": return STPPaymentMethodType.AUBECSDebit
            case "BacsDebit": return STPPaymentMethodType.bacsDebit
            case "Giropay": return STPPaymentMethodType.giropay
            case "P24": return STPPaymentMethodType.przelewy24
            case "Eps": return STPPaymentMethodType.EPS
            case "Bancontact": return STPPaymentMethodType.bancontact
            case "Oxxo": return STPPaymentMethodType.OXXO
            case "Sofort": return STPPaymentMethodType.sofort
            case "Upi": return STPPaymentMethodType.UPI
            case "AfterpayClearpay": return STPPaymentMethodType.afterpayClearpay
            case "WeChatPay": return STPPaymentMethodType.weChatPay
            default: return STPPaymentMethodType.unknown
            }
        }
        return nil
    }
    
    class func mapCaptureMethod(_ captureMethod: STPPaymentIntentCaptureMethod?) -> String {
        if let captureMethod = captureMethod {
            switch captureMethod {
            case STPPaymentIntentCaptureMethod.automatic: return "Automatic"
            case STPPaymentIntentCaptureMethod.manual: return "Manual"
            default: return "Unknown"
            }
        }
        return "Unknown"
    }
    
    class func mapConfirmationMethod(_ confirmationMethod: STPPaymentIntentConfirmationMethod?) -> String {
        if let confirmationMethod = confirmationMethod {
            switch confirmationMethod {
            case STPPaymentIntentConfirmationMethod.automatic: return "Automatic"
            case STPPaymentIntentConfirmationMethod.manual: return "Manual"
            default: return "Unknown"
            }
        }
        return "Unknown"
    }
    
    class func mapIntentShipping(_ shipping: STPPaymentIntentShippingDetails) -> NSDictionary {
        var addressDetails = NSDictionary()
        if let address = shipping.address {
            addressDetails = [
                "city": address.city ?? NSNull(),
                "country": address.country ?? NSNull(),
                "line1": address.line1 ?? NSNull(),
                "line2":address.line2 ?? NSNull(),
                "postalCode": address.postalCode ?? NSNull(),
            ]
        }
        let shippingDetails: NSDictionary = [
            "address": addressDetails,
            "name": shipping.name ?? NSNull(),
            "phone": shipping.phone ?? NSNull(),
            "trackingNumber": shipping.trackingNumber ?? NSNull(),
            "carrier": shipping.carrier ?? NSNull(),
        ]
        return shippingDetails
    }
    
    class func mapFromPaymentIntent (paymentIntent: STPPaymentIntent) -> NSDictionary {
        let intent: NSMutableDictionary = [
            "id": paymentIntent.stripeId,
            "currency": paymentIntent.currency,
            "status": Mappers.mapIntentStatus(status: paymentIntent.status),
            "description": paymentIntent.description,
            "clientSecret": paymentIntent.clientSecret,
            "receiptEmail": paymentIntent.receiptEmail ?? NSNull(),
            "livemode": paymentIntent.livemode,
            "paymentMethodId": paymentIntent.paymentMethodId ?? NSNull(),
            "captureMethod": mapCaptureMethod(paymentIntent.captureMethod),
            "confirmationMethod": mapConfirmationMethod(paymentIntent.confirmationMethod),
            "created": convertDateToUnixTimestamp(date: paymentIntent.created) ?? NSNull(),
            "amount": paymentIntent.amount,
            "lastPaymentError": NSNull(),
            "shipping": NSNull(),
            "canceledAt": NSNull()
        ]
        
        if let lastPaymentError = paymentIntent.lastPaymentError {
            let paymentError: NSMutableDictionary = [
                "code": lastPaymentError.code ?? NSNull(),
                "message": lastPaymentError.message ?? NSNull(),
                "type": mapFromPaymentIntentLastPaymentErrorType(lastPaymentError.type),
                "declineCode": lastPaymentError.declineCode ?? NSNull(),
                "paymentMethod": mapFromPaymentMethod(lastPaymentError.paymentMethod) ?? NSNull()
            ]
            
            intent.setValue(paymentError, forKey: "lastPaymentError")
        }
        
        if let shipping = paymentIntent.shipping {
            intent.setValue(mapIntentShipping(shipping), forKey: "shipping")
        }
        
        if let canceledAt = paymentIntent.canceledAt {
            intent.setValue(convertDateToUnixTimestamp(date: canceledAt), forKey: "canceledAt")
        }
        
        return intent;
    }
    
    class func mapFromPaymentIntentLastPaymentErrorType(_ errorType: STPPaymentIntentLastPaymentErrorType?) -> String? {
        if let errorType = errorType {
            switch errorType {
            case STPPaymentIntentLastPaymentErrorType.apiConnection: return "api_connection_error"
            case STPPaymentIntentLastPaymentErrorType.api: return "api_error"
            case STPPaymentIntentLastPaymentErrorType.authentication: return "authentication_error"
            case STPPaymentIntentLastPaymentErrorType.card: return "card_error"
            case STPPaymentIntentLastPaymentErrorType.idempotency: return "idempotency_error"
            case STPPaymentIntentLastPaymentErrorType.invalidRequest: return "invalid_request_error"
            case STPPaymentIntentLastPaymentErrorType.rateLimit: return "rate_limit_error"
            case STPPaymentIntentLastPaymentErrorType.unknown: return nil
            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromSetupIntentLastPaymentErrorType(_ errorType: STPSetupIntentLastSetupErrorType?) -> String? {
        if let errorType = errorType {
            switch errorType {
            case STPSetupIntentLastSetupErrorType.apiConnection: return "api_connection_error"
            case STPSetupIntentLastSetupErrorType.API: return "api_error"
            case STPSetupIntentLastSetupErrorType.authentication: return "authentication_error"
            case STPSetupIntentLastSetupErrorType.card: return "card_error"
            case STPSetupIntentLastSetupErrorType.idempotency: return "idempotency_error"
            case STPSetupIntentLastSetupErrorType.invalidRequest: return "invalid_request_error"
            case STPSetupIntentLastSetupErrorType.rateLimit: return "rate_limit_error"
            case STPSetupIntentLastSetupErrorType.unknown: return nil
            default: return nil
            }
        }
        return nil
    }
    
    class func mapToBillingDetails(billingDetails: NSDictionary?) -> STPPaymentMethodBillingDetails? {
        guard let billingDetails = billingDetails else {
            return nil
        }
        let billing = STPPaymentMethodBillingDetails()
        billing.email = RCTConvert.nsString(billingDetails["email"])
        billing.phone = RCTConvert.nsString(billingDetails["phone"])
        billing.name = RCTConvert.nsString(billingDetails["name"])
        
        let billingAddres = STPPaymentMethodAddress()
        
        billingAddres.city = RCTConvert.nsString(billingDetails["addressCity"])
        billingAddres.postalCode = RCTConvert.nsString(billingDetails["addressPostalCode"])
        billingAddres.country = RCTConvert.nsString(billingDetails["addressCountry"])
        billingAddres.line1 = RCTConvert.nsString(billingDetails["addressLine1"])
        billingAddres.line2 = RCTConvert.nsString(billingDetails["addressLine2"])
        billingAddres.state = RCTConvert.nsString(billingDetails["addressState"])
        
        billing.address = billingAddres
        
        return billing
    }
    
    class func mapToShippingDetails(shippingDetails: NSDictionary?) -> STPPaymentIntentShippingDetailsParams? {
        guard let shippingDetails = shippingDetails else {
            return nil
        }
        let shippingAddress = STPPaymentIntentShippingDetailsAddressParams(line1: shippingDetails["addressLine1"] as? String ?? "")
        
        shippingAddress.city = shippingDetails["addressCity"] as? String
        shippingAddress.postalCode = shippingDetails["addressPostalCode"] as? String
        shippingAddress.country = shippingDetails["addressCountry"] as? String
        shippingAddress.line1 = shippingDetails["addressLine1"] as? String ?? ""
        shippingAddress.line2 = shippingDetails["addressLine2"] as? String
        shippingAddress.state = shippingDetails["addressState"] as? String
        
        let shipping = STPPaymentIntentShippingDetailsParams(address: shippingAddress, name: shippingDetails["name"] as? String ?? "")
        
        return shipping
    }
    
    class func mapFromBillingDetails(billingDetails: STPPaymentMethodBillingDetails?) -> NSDictionary {
        let billing: NSDictionary = [
            "email": billingDetails?.email ?? NSNull(),
            "phone": billingDetails?.phone ?? NSNull(),
            "name": billingDetails?.name ?? NSNull(),
            "address": [
                "city": billingDetails?.address?.city,
                "postalCode": billingDetails?.address?.postalCode,
                "country": billingDetails?.address?.country,
                "line1": billingDetails?.address?.line1,
                "line2": billingDetails?.address?.line2,
                "state": billingDetails?.address?.state,
            ],
        ]
        
        return billing
    }
    
    class func mapCardBrand(_ brand: STPCardBrand?) -> String? {
        if let brand = brand {
            switch brand {
            case STPCardBrand.visa: return "Visa"
            case STPCardBrand.amex: return "AmericanExpress"
            case STPCardBrand.mastercard: return "MasterCard"
            case STPCardBrand.discover: return "Discover"
            case STPCardBrand.JCB: return "JCB"
            case STPCardBrand.dinersClub: return "DinersClub"
            case STPCardBrand.unionPay: return "UnionPay"
            case STPCardBrand.unknown: return "Unknown"
            default: return nil
            }
        }
        return nil
    }
    
    class func mapFromPaymentMethod(_ paymentMethod: STPPaymentMethod?) -> NSDictionary? {
        guard let paymentMethod = paymentMethod else {
            return nil
        }
        let card: NSDictionary = [
            "brand": Mappers.mapCardBrand(paymentMethod.card?.brand) ?? NSNull(),
            "country": paymentMethod.card?.country ?? NSNull(),
            "expYear": paymentMethod.card?.expYear ?? NSNull(),
            "expMonth": paymentMethod.card?.expMonth ?? NSNull(),
            "fingerprint": paymentMethod.card?.fingerprint ?? NSNull(),
            "funding": paymentMethod.card?.funding ?? NSNull(),
            "last4": paymentMethod.card?.last4 ?? NSNull()
        ]
        let sepaDebit: NSDictionary = [
            "bankCode": paymentMethod.sepaDebit?.bankCode ?? NSNull(),
            "country": paymentMethod.sepaDebit?.country ?? NSNull(),
            "fingerprint": paymentMethod.sepaDebit?.fingerprint ?? NSNull(),
            "last4": paymentMethod.sepaDebit?.last4 ?? NSNull(),
        ]
        let bacsDebit: NSDictionary = [
            "fingerprint": paymentMethod.bacsDebit?.fingerprint ?? NSNull(),
            "last4": paymentMethod.bacsDebit?.last4 ?? NSNull(),
            "sortCode": paymentMethod.bacsDebit?.sortCode ?? NSNull()
        ]
        let auBECSDebit: NSDictionary = [
            "bsbNumber": paymentMethod.auBECSDebit?.bsbNumber ?? NSNull(),
            "fingerprint": paymentMethod.auBECSDebit?.fingerprint ?? NSNull(),
            "last4": paymentMethod.auBECSDebit?.last4 ?? NSNull()
        ]
        let method: NSDictionary = [
            "id": paymentMethod.stripeId,
            "type": Mappers.mapPaymentMethodType(type: paymentMethod.type),
            "livemode": paymentMethod.liveMode,
            "customerId": paymentMethod.customerId ?? NSNull(),
            "billingDetails": Mappers.mapFromBillingDetails(billingDetails: paymentMethod.billingDetails),
            "Card": card,
            "Ideal": [
                "bankIdentifierCode": paymentMethod.iDEAL?.bankIdentifierCode ?? "",
                "bankName": paymentMethod.iDEAL?.bankName ?? ""
            ],
            "Fpx": [
                "bank": paymentMethod.fpx?.bankIdentifierCode ?? "",
            ],
            "SepaDebit": sepaDebit,
            "BacsDebit": bacsDebit,
            "AuBecsDebit": auBECSDebit,
            "Sofort": [
                "country": paymentMethod.sofort?.country
            ],
            "Upi": [
                "vpa": paymentMethod.upi?.vpa
            ],
        ]
        return method
    }
    
    class func mapIntentStatus(status: STPSetupIntentStatus?) -> String {
        if let status = status {
            switch status {
            case STPSetupIntentStatus.succeeded: return "Succeeded"
            case STPSetupIntentStatus.requiresPaymentMethod: return "RequiresPaymentMethod"
            case STPSetupIntentStatus.requiresConfirmation: return "RequiresConfirmation"
            case STPSetupIntentStatus.canceled: return "Canceled"
            case STPSetupIntentStatus.processing: return "Processing"
            case STPSetupIntentStatus.requiresAction: return "RequiresAction"
            case STPSetupIntentStatus.unknown: return "Unknown"
            default: return "Unknown"
            }
        }
        return "Unknown"
    }
    
    class func mapFromSetupIntentUsage(usage: STPSetupIntentUsage?) -> String {
        if let usage = usage {
            switch usage {
            case STPSetupIntentUsage.none: return "None"
            case STPSetupIntentUsage.offSession: return "OffSession"
            case STPSetupIntentUsage.onSession: return "OnSession"
            case STPSetupIntentUsage.unknown: return "Unknown"
            default: return "Unknown"
            }
        }
        return "Unknown"
    }
    
    class func mapToPaymentIntentFutureUsage(usage: String?) -> STPPaymentIntentSetupFutureUsage {
        if let usage = usage {
            switch usage {
            case "None": return STPPaymentIntentSetupFutureUsage.none
            case "OffSession": return STPPaymentIntentSetupFutureUsage.offSession
            case "OnSession": return STPPaymentIntentSetupFutureUsage.onSession
            case "Unknown": return STPPaymentIntentSetupFutureUsage.unknown
            default: return STPPaymentIntentSetupFutureUsage.unknown
            }
        }
        return STPPaymentIntentSetupFutureUsage.unknown
    }
    
    class func mapFromSetupIntent(setupIntent: STPSetupIntent) -> NSDictionary {
        let intent: NSMutableDictionary = [
            "id": setupIntent.stripeID,
            "clientSecret": setupIntent.clientSecret,
            "status": mapIntentStatus(status: setupIntent.status),
            "description": setupIntent.stripeDescription ?? NSNull(),
            "livemode": setupIntent.livemode,
            "paymentMethodTypes": NSArray(),
            "usage": mapFromSetupIntentUsage(usage: setupIntent.usage),
            "paymentMethodId": setupIntent.paymentMethodID ?? NSNull(),
            "created": NSNull(),
            "lastSetupError": NSNull()
        ]
        
        
        let types = setupIntent.paymentMethodTypes.map {
            mapPaymentMethodType(type: STPPaymentMethodType.init(rawValue: Int(truncating: $0))!)
        }
        
        intent.setValue(types, forKey: "paymentMethodTypes")
        intent.setValue(convertDateToUnixTimestamp(date: setupIntent.created), forKey: "created")
        
        if let lastSetupError = setupIntent.lastSetupError {
            let setupError: NSMutableDictionary = [
                "code": lastSetupError.code ?? NSNull(),
                "message": lastSetupError.description,
                "type": mapFromSetupIntentLastPaymentErrorType(lastSetupError.type) ?? NSNull(),
                "declineCode": lastSetupError.declineCode ?? NSNull(),
                "paymentMethod": mapFromPaymentMethod(lastSetupError.paymentMethod) ?? NSNull()
            ]
            intent.setValue(setupError, forKey: "lastSetupError")
        }
        
        return intent
    }
    
    @available(iOS 13.0, *)
    class func mapToUserInterfaceStyle(_ style: String) -> PaymentSheet.UserInterfaceStyle {
        switch style {
        case "alwaysDark": return PaymentSheet.UserInterfaceStyle.alwaysDark
        case "alwaysLight": return PaymentSheet.UserInterfaceStyle.alwaysLight
        default: return PaymentSheet.UserInterfaceStyle.automatic
        }
    }
    
    class func mapToReturnURL(urlScheme: String) -> String {
        return urlScheme + "://safepay"
    }
    
    class func mapUICustomization(_ params: NSDictionary) -> STPThreeDSUICustomization {
        let uiCustomization = STPThreeDSUICustomization()
        if let labelSettings = params["label"] as? Dictionary<String, Any?> {
            if let headingTextColor = labelSettings["headingTextColor"] as? String {
                uiCustomization.labelCustomization.headingTextColor = UIColor(hexString: headingTextColor)
            }
            if let textColor = labelSettings["textColor"] as? String {
                uiCustomization.labelCustomization.textColor = UIColor(hexString: textColor)
            }
            if let headingFontSize = labelSettings["headingFontSize"] as? Int {
                uiCustomization.labelCustomization.headingFont = UIFont.systemFont(ofSize: CGFloat(headingFontSize))
            }
            if let textFontSize = labelSettings["textFontSize"] as? Int {
                uiCustomization.labelCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
        }
        
        if let navigationBarSettings = params["navigationBar"] as? Dictionary<String, Any?> {
            if let barTintColor = navigationBarSettings["barTintColor"] as? String {
                uiCustomization.navigationBarCustomization.barTintColor = UIColor(hexString: barTintColor)
            }
            if let barStyle = navigationBarSettings["barStyle"] as? Int {
                uiCustomization.navigationBarCustomization.barStyle = UIBarStyle(rawValue: barStyle) ?? .default
            }
            if let headerText = navigationBarSettings["headerText"] as? String {
                uiCustomization.navigationBarCustomization.headerText = headerText
            }
            if let buttonText = navigationBarSettings["buttonText"] as? String {
                uiCustomization.navigationBarCustomization.buttonText = buttonText
            }
            if let textFontSize = navigationBarSettings["textFontSize"] as? Int {
                uiCustomization.navigationBarCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = navigationBarSettings["textColor"] as? String {
                uiCustomization.navigationBarCustomization.textColor = UIColor(hexString: textColor)
            }
            if let translucent = navigationBarSettings["translucent"] as? Bool {
                uiCustomization.navigationBarCustomization.translucent = translucent
            }
        }
        
        if let textFieldSettings = params["textField"] as? Dictionary<String, Any?> {
            if let borderColor = textFieldSettings["borderColor"] as? String {
                uiCustomization.textFieldCustomization.borderColor = UIColor(hexString: borderColor)
            }
            if let borderWidth = textFieldSettings["borderWidth"] as? Int {
                uiCustomization.textFieldCustomization.borderWidth = CGFloat(borderWidth)
            }
            if let borderRadius = textFieldSettings["borderRadius"] as? Int {
                uiCustomization.textFieldCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textColor = textFieldSettings["textColor"] as? String {
                uiCustomization.textFieldCustomization.textColor = UIColor(hexString: textColor)
            }
            if let textFontSize = textFieldSettings["textFontSize"] as? Int {
                uiCustomization.textFieldCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
        }
        
        if let footerSettings = params["footer"] as? Dictionary<String, Any?> {
            if let backgroundColor = footerSettings["backgroundColor"] as? String {
                uiCustomization.footerCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let chevronColor = footerSettings["chevronColor"] as? String {
                uiCustomization.footerCustomization.chevronColor = UIColor(hexString: chevronColor)
            }
            if let headingTextColor = footerSettings["headingTextColor"] as? String {
                uiCustomization.footerCustomization.headingTextColor = UIColor(hexString: headingTextColor)
            }
            if let textColor = footerSettings["textColor"] as? String {
                uiCustomization.footerCustomization.textColor = UIColor(hexString: textColor)
            }
        }
        
        if let submitButtonSettings = params["submitButton"] as? Dictionary<String, Any?> {
            let buttonCustomization = uiCustomization.buttonCustomization(for: STPThreeDSCustomizationButtonType.submit)
            
            if let backgroundColor = submitButtonSettings["backgroundColor"] as? String {
                buttonCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderRadius = submitButtonSettings["borderRadius"] as? Int {
                buttonCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textFontSize = submitButtonSettings["textFontSize"] as? Int {
                buttonCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = submitButtonSettings["textColor"] as? String {
                buttonCustomization.textColor = UIColor(hexString: textColor)
            }
            
            uiCustomization.setButtonCustomization(buttonCustomization, for: STPThreeDSCustomizationButtonType.submit)
        }
        
        if let submitButtonSettings = params["cancelButton"] as? Dictionary<String, Any?> {
            let buttonCustomization = uiCustomization.buttonCustomization(for: STPThreeDSCustomizationButtonType.cancel)
            
            if let backgroundColor = submitButtonSettings["backgroundColor"] as? String {
                buttonCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderRadius = submitButtonSettings["borderRadius"] as? Int {
                buttonCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textFontSize = submitButtonSettings["textFontSize"] as? Int {
                buttonCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = submitButtonSettings["textColor"] as? String {
                buttonCustomization.textColor = UIColor(hexString: textColor)
            }
            
            uiCustomization.setButtonCustomization(buttonCustomization, for: STPThreeDSCustomizationButtonType.cancel)
        }
        
        if let submitButtonSettings = params["continueButton"] as? Dictionary<String, Any?> {
            let buttonCustomization = uiCustomization.buttonCustomization(for: STPThreeDSCustomizationButtonType.continue)
            
            if let backgroundColor = submitButtonSettings["backgroundColor"] as? String {
                buttonCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderRadius = submitButtonSettings["borderRadius"] as? Int {
                buttonCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textFontSize = submitButtonSettings["textFontSize"] as? Int {
                buttonCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = submitButtonSettings["textColor"] as? String {
                buttonCustomization.textColor = UIColor(hexString: textColor)
            }
            
            uiCustomization.setButtonCustomization(buttonCustomization, for: STPThreeDSCustomizationButtonType.continue)
        }
        
        if let submitButtonSettings = params["nextButton"] as? Dictionary<String, Any?> {
            let buttonCustomization = uiCustomization.buttonCustomization(for: STPThreeDSCustomizationButtonType.next)
            
            if let backgroundColor = submitButtonSettings["backgroundColor"] as? String {
                buttonCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderRadius = submitButtonSettings["borderRadius"] as? Int {
                buttonCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textFontSize = submitButtonSettings["textFontSize"] as? Int {
                buttonCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = submitButtonSettings["textColor"] as? String {
                buttonCustomization.textColor = UIColor(hexString: textColor)
            }
            
            uiCustomization.setButtonCustomization(buttonCustomization, for: STPThreeDSCustomizationButtonType.next)
        }
        
        if let submitButtonSettings = params["resendButton"] as? Dictionary<String, Any?> {
            let buttonCustomization = uiCustomization.buttonCustomization(for: STPThreeDSCustomizationButtonType.resend)
            
            if let backgroundColor = submitButtonSettings["backgroundColor"] as? String {
                buttonCustomization.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderRadius = submitButtonSettings["borderRadius"] as? Int {
                buttonCustomization.cornerRadius = CGFloat(borderRadius)
            }
            if let textFontSize = submitButtonSettings["textFontSize"] as? Int {
                buttonCustomization.font = UIFont.systemFont(ofSize: CGFloat(textFontSize))
            }
            if let textColor = submitButtonSettings["textColor"] as? String {
                buttonCustomization.textColor = UIColor(hexString: textColor)
            }
            
            uiCustomization.setButtonCustomization(buttonCustomization, for: STPThreeDSCustomizationButtonType.resend)
        }
        
        if let backgroundColor = params["backgroundColor"] as? String {
            uiCustomization.backgroundColor = UIColor(hexString: backgroundColor)
        }
        
        
        return uiCustomization
    }
    
    class func convertDateToUnixTimestamp(date: Date?) -> String? {
        if let date = date {
            let value = date.timeIntervalSince1970 * 1000.0
            return String(format: "%.0f", value)
        }
        return nil
    }
}
