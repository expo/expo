import Stripe
@_spi(STP) import StripeCore

enum ErrorType {
    static let Failed = "Failed"
    static let Canceled = "Canceled"
    static let Unknown = "Unknown"
    static let Timeout = "Timeout"
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
        let rootError = getRootError(error)

        let value: NSDictionary = [
            "code": code,
            "message": rootError?.userInfo[STPError.errorMessageKey] ?? rootError?.localizedDescription ?? NSNull(),
            "localizedMessage": rootError?.localizedDescription ?? NSNull(),
            "declineCode": rootError?.userInfo[STPError.stripeDeclineCodeKey] ?? NSNull(),
            "stripeErrorCode": rootError?.userInfo[STPError.stripeErrorCodeKey] ?? NSNull(),
            "type": rootError?.userInfo[STPError.stripeErrorTypeKey] ?? NSNull(),
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
    
    class func createError(_ code: String, _ error: Error) -> NSDictionary {
        if let stripeError = error as? StripeError {
            return createError(code, NSError.stp_error(from: stripeError))
        }
        
        return createError(code, error as NSError?)
    }
    
    class func getRootError(_ error: NSError?) -> NSError? {
        // Dig and find the underlying error, otherwise we'll throw errors like "Try again"
        if let underlyingError = error?.userInfo[NSUnderlyingErrorKey] as? NSError {
            return getRootError(underlyingError)
        }
        return error
    }
    
    static let MISSING_INIT_ERROR = Errors.createError(ErrorType.Failed, "Stripe has not been initialized. Initialize Stripe in your app with the StripeProvider component or the initStripe method.")
}

