enum ConfirmPaymentErrorType: String {
    case Failed, Canceled, Unknown
}

enum ApplePayErrorType: String {
    case Failed, Canceled, Unknown
}

enum NextPaymentActionErrorType: String {
    case Failed, Canceled, Unknown
}

enum ConfirmSetupIntentErrorType: String {
    case Failed, Canceled, Unknown
}

enum RetrievePaymentIntentErrorType: String {
    case Unknown
}

enum PaymentSheetErrorType: String {
    case Failed, Canceled
}

class Errors {
    class func createError (code: String, message: String) -> NSDictionary {
        let error: NSDictionary = [
            "code": code,
            "message": message,
        ]
        
        return error
    }
}
