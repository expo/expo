import Stripe

enum ErrorType {
    static let Failed = "Failed"
    static let Canceled = "Canceled"
    static let Unknown = "Unknown"
}

class Errors {
    static internal let isPIClientSecretValidRegex: NSRegularExpression? = try? NSRegularExpression(
        pattern: "^pi_[^_]+_secret_[^_]+$", options: [])

    static internal let isSetiClientSecretValidRegex: NSRegularExpression? = try? NSRegularExpression(
        pattern: "^seti_[^_]+_secret_[^_]+$", options: [])
    
    static internal let isEKClientSecretValidRegex: NSRegularExpression? = try? NSRegularExpression(
        pattern: "^ek_[^_](.)+$", options: [])

    class func isPIClientSecretValid(clientSecret: String) -> Bool {
        return (Errors.isPIClientSecretValidRegex?.numberOfMatches(
            in: clientSecret,
            options: .anchored,
            range: NSRange(location: 0, length: clientSecret.count))) == 1
    }
    class func isSetiClientSecretValid(clientSecret: String) -> Bool {
        return (Errors.isSetiClientSecretValidRegex?.numberOfMatches(
            in: clientSecret,
            options: .anchored,
            range: NSRange(location: 0, length: clientSecret.count))) == 1
    }
    class func isEKClientSecretValid(clientSecret: String) -> Bool {
        return (Errors.isEKClientSecretValidRegex?.numberOfMatches(
            in: clientSecret,
            options: .anchored,
            range: NSRange(location: 0, length: clientSecret.count))) == 1
    }

    class func createError (_ code: String, _ message: String?) -> NSDictionary {
        let value: NSDictionary = [
            "code": code,
            "message": message ?? NSNull(),
            "localizedMessage": message ?? NSNull(),
            "declineCode": NSNull(),
            "stripeErrorCode": NSNull(),
            "type": NSNull()
        ]
        
        return ["error": value]
    }
    class func createError (_ code: String, _ error: NSError?) -> NSDictionary {
        let value: NSDictionary = [
            "code": code,
            "message": error?.userInfo[STPError.errorMessageKey] ?? NSNull(),
            "localizedMessage": error?.localizedDescription ?? NSNull(),
            "declineCode": error?.userInfo[STPError.stripeDeclineCodeKey] ?? NSNull(),
            "stripeErrorCode": error?.userInfo[STPError.stripeErrorCodeKey] ?? NSNull(),
            "type": error?.userInfo[STPError.stripeErrorTypeKey] ?? NSNull(),
        ]
        
        return ["error": value]
    }
    class func createError (_ code: String, _ error: STPSetupIntentLastSetupError?) -> NSDictionary {
        let value: NSDictionary = [
            "code": code,
            "message": error?.message ?? NSNull(),
            "localizedMessage": error?.message ?? NSNull(),
            "declineCode": error?.declineCode ?? NSNull(),
            "stripeErrorCode": error?.code ?? NSNull(),
            "type": Mappers.mapFromSetupIntentLastPaymentErrorType(error?.type) ?? NSNull()
        ]
        
        return ["error": value]
    }
    
    class func createError (_ code: String, _ error: STPPaymentIntentLastPaymentError?) -> NSDictionary {
        let value: NSDictionary = [
            "code": code,
            "message": error?.message ?? NSNull(),
            "localizedMessage": error?.message ?? NSNull(),
            "declineCode": error?.declineCode ?? NSNull(),
            "stripeErrorCode": error?.code ?? NSNull(),
            "type": Mappers.mapFromPaymentIntentLastPaymentErrorType(error?.type) ?? NSNull()
        ]
        
        return ["error": value]
    }
}

