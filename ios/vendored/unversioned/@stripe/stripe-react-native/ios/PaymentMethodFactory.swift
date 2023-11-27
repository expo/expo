import Foundation
import Stripe

class PaymentMethodFactory {
    var billingDetailsParams: STPPaymentMethodBillingDetails? = nil
    var paymentMethodData: NSDictionary? = nil
    var paymentMethodOptions: NSDictionary? = nil
    var cardFieldView: CardFieldView? = nil
    var cardFormView: CardFormView? = nil

    init(paymentMethodData: NSDictionary?, options: NSDictionary, cardFieldView: CardFieldView?, cardFormView: CardFormView?) {
        self.paymentMethodData = paymentMethodData
        self.billingDetailsParams = Mappers.mapToBillingDetails(billingDetails: paymentMethodData?["billingDetails"] as? NSDictionary)
        self.paymentMethodOptions = options
        self.cardFieldView = cardFieldView
        self.cardFormView = cardFormView
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
            case STPPaymentMethodType.klarna:
                return try createKlarnaPaymentMethodParams()
            case STPPaymentMethodType.USBankAccount:
                return try createUSBankAccountPaymentMethodParams()
            case STPPaymentMethodType.payPal:
                return try createPayPalPaymentMethodParams()
            case STPPaymentMethodType.affirm:
                return try createAffirmPaymentMethodParams()
            case STPPaymentMethodType.cashApp:
                return try createCashAppPaymentMethodParams()
            case STPPaymentMethodType.revolutPay:
                return try createRevolutPayPaymentMethodParams()
//            case STPPaymentMethodType.weChatPay:
//                return try createWeChatPayPaymentMethodParams()
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
            case STPPaymentMethodType.klarna:
                return nil
            case STPPaymentMethodType.weChatPay:
                return try createWeChatPayPaymentMethodOptions()
            case STPPaymentMethodType.USBankAccount:
                return try createUSBankAccountPaymentMethodOptions()
            case STPPaymentMethodType.payPal:
                return nil
            case STPPaymentMethodType.affirm:
                return nil
            case STPPaymentMethodType.cashApp:
                return nil
            case STPPaymentMethodType.revolutPay:
                return nil
            default:
                throw PaymentMethodError.paymentNotSupported
            }
        } catch {
            throw error
        }
    }

//    private func createWeChatPayPaymentMethodParams() throws -> STPPaymentMethodParams {
//        let params = STPPaymentMethodWeChatPayParams()
//        return STPPaymentMethodParams(weChatPay: params, billingDetails: billingDetailsParams, metadata: nil)
//    }
//

    private func createUSBankAccountPaymentMethodOptions() throws -> STPConfirmPaymentMethodOptions {
        let paymentOptions = STPConfirmPaymentMethodOptions()
        if let usage = self.paymentMethodOptions?["setupFutureUsage"] as? String {
            paymentOptions.usBankAccountOptions = STPConfirmUSBankAccountOptions(setupFutureUsage: Mappers.mapToPaymentIntentFutureUsage(usage: usage))
        }

        return paymentOptions
    }

    private func createWeChatPayPaymentMethodOptions() throws -> STPConfirmPaymentMethodOptions {
        guard let appId = self.paymentMethodData?["appId"] as? String else {
            throw PaymentMethodError.weChatPayPaymentMissingParams
        }
        let paymentOptions = STPConfirmPaymentMethodOptions()
        paymentOptions.weChatPayOptions = STPConfirmWeChatPayOptions(appId: appId)

        return paymentOptions
    }

    private func createIDEALPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodiDEALParams()
        if let bankName = self.paymentMethodData?["bankName"] as? String {
            params.bankName = bankName
        }
        

        return STPPaymentMethodParams(iDEAL: params, billingDetails: billingDetailsParams, metadata: nil)
    }

    private func createGrabpayPaymentMethodParams() -> STPPaymentMethodParams {
        let params = STPPaymentMethodGrabPayParams()

        return STPPaymentMethodParams(grabPay: params, billingDetails: billingDetailsParams, metadata: nil)
    }

    private func createCardPaymentMethodParams() throws -> STPPaymentMethodParams {
        if let token = paymentMethodData?["token"] as? String {
            let methodParams = STPPaymentMethodCardParams()
            methodParams.token = token
            return STPPaymentMethodParams(card: methodParams, billingDetails: billingDetailsParams, metadata: nil)
        }

        if let params = cardFieldView?.cardParams as? STPPaymentMethodParams {
            if let postalCode = cardFieldView?.cardPostalCode{
                if (billingDetailsParams == nil) {
                    let bd = STPPaymentMethodBillingDetails()
                    bd.address = STPPaymentMethodAddress()
                    bd.address?.postalCode = postalCode
                    billingDetailsParams = bd
                } else {
                    billingDetailsParams?.address?.postalCode = postalCode
                }
            }
            params.billingDetails = billingDetailsParams
            return params
        }
        if let params = cardFormView?.cardParams as? STPPaymentMethodCardParams {
            if let address = cardFormView?.cardForm?.cardParams?.billingDetails?.address {
                if (billingDetailsParams == nil) {
                    let bd = STPPaymentMethodBillingDetails()
                    bd.address = STPPaymentMethodAddress()
                    bd.address?.postalCode = address.postalCode
                    bd.address?.country = address.country
                    billingDetailsParams = bd
                } else {
                    billingDetailsParams?.address?.postalCode = address.postalCode
                    billingDetailsParams?.address?.country = address.country
                }
            }
            return STPPaymentMethodParams(card: params, billingDetails: billingDetailsParams, metadata: nil)
        }

        throw PaymentMethodError.cardPaymentMissingParams
    }


    private func createCardPaymentMethodOptions() -> STPConfirmPaymentMethodOptions? {
        let cvc = paymentMethodData?["cvc"] as? String
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

        if self.paymentMethodData?["testOfflineBank"] as? Bool == true {
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
        guard let country = self.paymentMethodData?["country"] as? String else {
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
        guard let iban = self.paymentMethodData?["iban"] as? String else {
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
        let formDetails = self.paymentMethodData?["formDetails"] as? NSDictionary

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

    private func createKlarnaPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodKlarnaParams()

        if let billingDetails = billingDetailsParams, billingDetails.address?.country != nil, billingDetails.email != nil {
            return STPPaymentMethodParams(klarna: params, billingDetails: billingDetails, metadata: nil)
        } else {
            throw PaymentMethodError.klarnaPaymentMissingParams
        }
    }
    
    private func createUSBankAccountPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodUSBankAccountParams()

        guard let accountNumber = self.paymentMethodData?["accountNumber"] as? String else {
            throw PaymentMethodError.usBankAccountPaymentMissingAccountNumber
        }
        guard let routingNumber = self.paymentMethodData?["routingNumber"] as? String else {
            throw PaymentMethodError.usBankAccountPaymentMissingRoutingNumber
        }

        params.accountNumber = accountNumber
        params.routingNumber = routingNumber
        params.accountHolderType = Mappers.mapToUSBankAccountHolderType(type: self.paymentMethodData?["accountHolderType"] as? String)
        params.accountType = Mappers.mapToUSBankAccountType(type: self.paymentMethodData?["accountType"] as? String)

        if let billingDetails = billingDetailsParams, billingDetails.name != nil {
            return STPPaymentMethodParams(usBankAccount: params, billingDetails: billingDetails, metadata: nil)
        } else {
            throw PaymentMethodError.usBankAccountPaymentMissingParams
        }
    }
    
    private func createPayPalPaymentMethodParams() throws -> STPPaymentMethodParams {
        return STPPaymentMethodParams(payPal: STPPaymentMethodPayPalParams(), billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createAffirmPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodAffirmParams()
        return STPPaymentMethodParams(affirm: params, metadata: nil)
    }
    
    private func createCashAppPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodCashAppParams()
        return STPPaymentMethodParams(cashApp: params, billingDetails: billingDetailsParams, metadata: nil)
    }
    
    private func createRevolutPayPaymentMethodParams() throws -> STPPaymentMethodParams {
        let params = STPPaymentMethodRevolutPayParams()
        return STPPaymentMethodParams(revolutPay: params, billingDetails: billingDetailsParams, metadata: nil)
    }

    func createMandateData() -> STPMandateDataParams? {
        if let mandateParams = paymentMethodData?["mandateData"] as? NSDictionary {
            if let customerAcceptanceParams = mandateParams["customerAcceptance"] as? NSDictionary {
                let mandate = STPMandateDataParams.init(customerAcceptance: STPMandateCustomerAcceptanceParams.init())
                
                mandate.customerAcceptance.type = .online
                if let onlineParams = customerAcceptanceParams["online"] as? NSDictionary {
                    mandate.customerAcceptance.onlineParams = .init(ipAddress: onlineParams["ipAddress"] as? String ?? "", userAgent: onlineParams["userAgent"] as? String ?? "")
                }
                return mandate
            }
        }
        return nil
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
    case klarnaPaymentMissingParams
    case weChatPayPaymentMissingParams
    case usBankAccountPaymentMissingParams
    case usBankAccountPaymentMissingAccountNumber
    case usBankAccountPaymentMissingRoutingNumber
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
        case .weChatPayPaymentMissingParams:
            return NSLocalizedString("You must provide appId", comment: "Create payment error")
        case .klarnaPaymentMissingParams:
            return NSLocalizedString("Klarna requires that you provide the following billing details: email, country", comment: "Create payment error")
        case .usBankAccountPaymentMissingParams:
            return NSLocalizedString("When creating a US bank account payment method, you must provide the following billing details: name", comment: "Create payment error")
        case .usBankAccountPaymentMissingAccountNumber:
            return NSLocalizedString("When creating a US bank account payment method, you must provide the bank account number", comment: "Create payment error")
        case .usBankAccountPaymentMissingRoutingNumber:
            return NSLocalizedString("When creating a US bank account payment method, you must provide the bank routing number", comment: "Create payment error")
        }
    }
}
