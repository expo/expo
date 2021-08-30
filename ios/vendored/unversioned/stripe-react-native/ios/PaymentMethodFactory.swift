import Foundation
import Stripe


class PaymentMethodFactory {
    var billingDetailsParams: STPPaymentMethodBillingDetails? = nil
    var params: NSDictionary? = nil
    var cardFieldView: CardFieldView? = nil
    
    init(params: NSDictionary, cardFieldView: CardFieldView?) {
        self.billingDetailsParams = Mappers.mapToBillingDetails(billingDetails: params["billingDetails"] as? NSDictionary)
        self.params = params
        self.cardFieldView = cardFieldView
    }
    
    func createParams(paymentMethodType: STPPaymentMethodType) throws -> STPPaymentMethodParams? {
        do {
            switch paymentMethodType {
            case STPPaymentMethodType.iDEAL:
                return try createIDEALPaymentMethodParams()
            case STPPaymentMethodType.OXXO:
                return try createOXXOPaymentMethodParams()
            case STPPaymentMethodType.card:
                return try createCardPaymentMethodParams()
            case STPPaymentMethodType.FPX:
                return try createFPXPaymentMethodParams()
            case STPPaymentMethodType.alipay:
                return try createAlipayPaymentMethodParams()
            case STPPaymentMethodType.sofort:
                return try createSofortPaymentMethodParams()
            case STPPaymentMethodType.bancontact:
                return try createBancontactPaymentMethodParams()
            case STPPaymentMethodType.SEPADebit:
                return try createSepaPaymentMethodParams()
            case STPPaymentMethodType.giropay:
                return try createGiropayPaymentMethodParams()
            case STPPaymentMethodType.EPS:
                return try createEPSPaymentMethodParams()
            case STPPaymentMethodType.grabPay:
                return createGrabpayPaymentMethodParams()
            case STPPaymentMethodType.przelewy24:
                return try createP24PaymentMethodParams()
            case STPPaymentMethodType.AUBECSDebit:
                return try createBECSDebitPaymentMethodParams()
            case STPPaymentMethodType.afterpayClearpay:
                return try createAfterpayClearpayPaymentMethodParams()
            default:
                throw PaymentMethodError.paymentNotSupported
            }
        } catch {
            throw error
        }
    }
    
    func createOptions(paymentMethodType: STPPaymentMethodType) throws -> STPConfirmPaymentMethodOptions? {
        do {
            switch paymentMethodType {
            case STPPaymentMethodType.iDEAL:
                return nil
            case STPPaymentMethodType.EPS:
                return nil
            case STPPaymentMethodType.card:
                return createCardPaymentMethodOptions()
            case STPPaymentMethodType.FPX:
                return nil
            case STPPaymentMethodType.sofort:
                return nil
            case STPPaymentMethodType.alipay:
                return try createAlipayPaymentMethodOptions()
            case STPPaymentMethodType.bancontact:
                return nil
            case STPPaymentMethodType.SEPADebit:
                return nil
            case STPPaymentMethodType.OXXO:
                return nil
            case STPPaymentMethodType.giropay:
                return nil
            case STPPaymentMethodType.grabPay:
                return nil
            case STPPaymentMethodType.przelewy24:
                return nil
            case STPPaymentMethodType.AUBECSDebit:
                return nil
            case STPPaymentMethodType.afterpayClearpay:
                return nil
            default:
                throw PaymentMethodError.paymentNotSupported
            }
        } catch {
            throw error
        }
    }
    
    private func createIDEALPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodiDEALParams()
        if let bankName = self.params?["bankName"] as? String {
            params.bankName = bankName
        }
        
        return STPPaymentMethodParams(iDEAL: params, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createGrabpayPaymentMethodParams() -> STPPaymentMethodParams {
        let params = STPPaymentMethodGrabPayParams()

        return STPPaymentMethodParams(grabPay: params, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createCardPaymentMethodParams() throws -> STPPaymentMethodParams {
        if let token = params?["token"] as? String {
            let methodParams = STPPaymentMethodCardParams()
            methodParams.token = RCTConvert.nsString(token)
            return STPPaymentMethodParams(card: methodParams, billingDetails: billingDetailsParams, metadata: nil)
        }
        guard let cardParams = cardFieldView?.cardParams else {
            throw PaymentMethodError.cardPaymentMissingParams
        }
        
        return STPPaymentMethodParams(card: cardParams, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    
    private func createCardPaymentMethodOptions() -> STPConfirmPaymentMethodOptions? {
        let cvc = params?["cvc"] as? String
        guard cvc != nil else {
            return nil
        }

        let cardOptions = STPConfirmCardOptions()
        cardOptions.cvc = cvc;
        let paymentMethodOptions = STPConfirmPaymentMethodOptions()
        paymentMethodOptions.cardOptions = cardOptions
        
        return paymentMethodOptions
    }
    
    private func createFPXPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodFPXParams()
        
        if self.params?["testOfflineBank"] as? Bool == true {
            params.rawBankString = "test_offline_bank"
        }

        return STPPaymentMethodParams(fpx: params, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createAlipayPaymentMethodParams() throws -> STPPaymentMethodParams {
        return STPPaymentMethodParams(alipay: STPPaymentMethodAlipayParams(), billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createP24PaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodPrzelewy24Params()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.p24PaymentMissingParams
        }
        
        return STPPaymentMethodParams(przelewy24: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createAlipayPaymentMethodOptions() throws -> STPConfirmPaymentMethodOptions {
        let options = STPConfirmPaymentMethodOptions()
        options.alipayOptions = STPConfirmAlipayOptions()
        return options
    }
    
    private func createSofortPaymentMethodParams() throws -> STPPaymentMethodParams {
        guard let country = self.params?["country"] as? String else {
            throw PaymentMethodError.sofortPaymentMissingParams
        }
        let params = STPPaymentMethodSofortParams()
        params.country = country
        
        return STPPaymentMethodParams(sofort: params, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createBancontactPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodBancontactParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.bancontactPaymentMissingParams
        }
        
        return STPPaymentMethodParams(bancontact: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createSepaPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodSEPADebitParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.sepaPaymentMissingParams
        }
        guard let iban = self.params?["iban"] as? String else {
            throw PaymentMethodError.sepaPaymentMissingParams
        }
        
        params.iban = iban
        
        return STPPaymentMethodParams(sepaDebit: params, billingDetails: billingDetails, metadata: nil)
    }
  
    private func createOXXOPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodOXXOParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.bancontactPaymentMissingParams
        }
        
        return STPPaymentMethodParams(oxxo: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createGiropayPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodGiropayParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.giropayPaymentMissingParams
        }
        
        return STPPaymentMethodParams(giropay: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createEPSPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodEPSParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.epsPaymentMissingParams
        }
        
        return STPPaymentMethodParams(eps: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createBECSDebitPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodAUBECSDebitParams()
        
        let billingDetails = STPPaymentMethodBillingDetails()
        let formDetails = self.params?["formDetails"] as? NSDictionary
        
        billingDetails.name = formDetails?["name"] as? String
        billingDetails.email = formDetails?["email"] as? String
        params.accountNumber = formDetails?["accountNumber"] as? String
        params.bsbNumber = formDetails?["bsbNumber"] as? String

        return STPPaymentMethodParams(aubecsDebit: params, billingDetails: billingDetails, metadata: nil)
    }
    
    private func createAfterpayClearpayPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodAfterpayClearpayParams()
        
        guard let billingDetails = billingDetailsParams else {
            throw PaymentMethodError.afterpayClearpayPaymentMissingParams
        }
        
        return STPPaymentMethodParams(afterpayClearpay: params, billingDetails: billingDetails, metadata: nil)
    }
}

enum PaymentMethodError: Error {
    case cardPaymentMissingParams
    case epsPaymentMissingParams
    case idealPaymentMissingParams
    case paymentNotSupported
    case sofortPaymentMissingParams
    case cardPaymentOptionsMissingParams
    case bancontactPaymentMissingParams
    case sepaPaymentMissingParams
    case giropayPaymentMissingParams
    case p24PaymentMissingParams
    case afterpayClearpayPaymentMissingParams
}

extension PaymentMethodError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .cardPaymentMissingParams:
            return NSLocalizedString("Card details not complete", comment: "Create payment error")
        case .giropayPaymentMissingParams:
            return NSLocalizedString("You must provide billing details", comment: "Create payment error")
        case .idealPaymentMissingParams:
            return NSLocalizedString("You must provide bank name", comment: "Create payment error")
        case .sofortPaymentMissingParams:
            return NSLocalizedString("You must provide bank account country", comment: "Create payment error")
        case .p24PaymentMissingParams:
            return NSLocalizedString("You must provide billing details", comment: "Create payment error")
        case .bancontactPaymentMissingParams:
            return NSLocalizedString("You must provide billing details", comment: "Create payment error")
        case .sepaPaymentMissingParams:
            return NSLocalizedString("You must provide billing details and IBAN", comment: "Create payment error")
        case .epsPaymentMissingParams:
            return NSLocalizedString("You must provide billing details", comment: "Create payment error")
        case .afterpayClearpayPaymentMissingParams:
            return NSLocalizedString("You must provide billing details", comment: "Create payment error")
        case .paymentNotSupported:
            return NSLocalizedString("This payment type is not supported yet", comment: "Create payment error")
        case .cardPaymentOptionsMissingParams:
            return NSLocalizedString("You must provide CVC number", comment: "Create payment error")
        }
       
    }
}
