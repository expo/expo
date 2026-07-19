// swiftlint:disable all
//
//  PKCS7_AppleReceipt.swift
//
//  Copyright © 2018 Filippo Maguolo.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

import Foundation

/*
 This extension allow to parse the content of an Apple receipt from the AppStore.
 
 Reference documentation
 https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ReceiptFields.html
 */
extension PKCS7 {

    public struct ReceiptInfo {

        /// CFBundleIdentifier in Info.plist
        public fileprivate(set) var bundleIdentifier: String?

        /// CFBundleIdentifier in Info.plist as bytes, used, with other data, to compute the SHA-1 hash during validation.
        public fileprivate(set) var bundleIdentifierData: Data?

        /// CFBundleVersion (in iOS) or CFBundleShortVersionString (in macOS) in Info.plist
        public fileprivate(set) var bundleVersion: String?

        /// CFBundleVersion (in iOS) or CFBundleShortVersionString (in macOS) in Info.plist
        public fileprivate(set) var originalApplicationVersion: String?

        /// Opaque value used, with other data, to compute the SHA-1 hash during validation.
        public fileprivate(set) var opaqueValue: Data?

        /// SHA-1 hash, used to validate the receipt.
        public fileprivate(set) var sha1: Data?

        public fileprivate(set) var receiptCreationDate: Date?
        public fileprivate(set) var receiptCreationDateString: String?
        public fileprivate(set) var receiptExpirationDate: Date?
        public fileprivate(set) var receiptExpirationDateString: String?
        public fileprivate(set) var inAppPurchases: [InAppPurchaseInfo]?
    }

    public struct InAppPurchaseInfo {
        public fileprivate(set) var quantity: UInt64?
        public fileprivate(set) var productId: String?
        public fileprivate(set) var transactionId: String?
        public fileprivate(set) var originalTransactionId: String?
        public fileprivate(set) var purchaseDate: Date?
        public fileprivate(set) var originalPurchaseDate: Date?
        public fileprivate(set) var expiresDate: Date?
        public fileprivate(set) var isInIntroOfferPeriod: UInt64?
        public fileprivate(set) var cancellationDate: Date?
        public fileprivate(set) var webOrderLineItemId: UInt64?
    }
    
    func parseDate(_ dateString: String) -> Date? {
        return ReceiptDateFormatter.date(from: dateString)        
    }

    public func receipt() -> ReceiptInfo? {
        guard let block = mainBlock.findOid(.pkcs7data) else { return nil }
        guard var receiptBlock = block.parent?.sub?.last?.sub(0)?.sub(0) else { return nil }
        var receiptInfo = ReceiptInfo()

        if receiptBlock.asString == "Xcode" {
            receiptBlock = receiptBlock.sub(0)!
        }
        
        for item in receiptBlock.sub ?? [] {
            let fieldType = (item.sub(0)?.value as? Data)?.uint64Value ?? 0
            let fieldValueString = item.sub(2)?.asString
            switch fieldType {
            case 2:
                receiptInfo.bundleIdentifier = fieldValueString
                receiptInfo.bundleIdentifierData = item.sub(2)?.rawValue

            case 3:
                receiptInfo.bundleVersion = fieldValueString

            case 4:
                receiptInfo.opaqueValue = item.sub(2)?.rawValue

            case 5:
                receiptInfo.sha1 = item.sub(2)?.rawValue

            case 19:
                receiptInfo.originalApplicationVersion = fieldValueString

            case 12:
                guard let fieldValueString = fieldValueString else { continue }
                receiptInfo.receiptCreationDateString = fieldValueString
                receiptInfo.receiptCreationDate = parseDate(fieldValueString)

            case 21:
                guard let fieldValueString = fieldValueString else { continue }
                receiptInfo.receiptExpirationDateString = fieldValueString
                receiptInfo.receiptExpirationDate = parseDate(fieldValueString)

            case 17:
                let subItems = item.sub(2)?.sub?.first?.sub ?? []
                if receiptInfo.inAppPurchases == nil {
                    receiptInfo.inAppPurchases = []
                }
                receiptInfo.inAppPurchases?.append(inAppPurchase(subItems))

            default:
                break
            }
        }
        return receiptInfo
    }
    
    private func inAppPurchase(_ subItems: [ASN1Object]) -> InAppPurchaseInfo {
        var inAppPurchaseInfo = InAppPurchaseInfo()
        subItems.forEach { subItem in
            let fieldType = (subItem.sub(0)?.value as? Data)?.uint64Value ?? 0
            let fieldValue = subItem.sub(2)?.sub?.first?.value
            switch fieldType {
            case 1701:
                inAppPurchaseInfo.quantity = (fieldValue as? Data)?.uint64Value
            case 1702:
                inAppPurchaseInfo.productId = fieldValue as? String
            case 1703:
                inAppPurchaseInfo.transactionId = fieldValue as? String
            case 1705:
                inAppPurchaseInfo.originalTransactionId = fieldValue as? String
            case 1704:
                if let fieldValueString = fieldValue as? String {
                    inAppPurchaseInfo.purchaseDate = parseDate(fieldValueString)
                }
            case 1706:
                if let fieldValueString = fieldValue as? String {
                    inAppPurchaseInfo.originalPurchaseDate = parseDate(fieldValueString)
                }
            case 1708:
                if let fieldValueString = fieldValue as? String {
                    inAppPurchaseInfo.expiresDate = parseDate(fieldValueString)
                }
            case 1719:
                inAppPurchaseInfo.isInIntroOfferPeriod = (fieldValue as? Data)?.uint64Value
            case 1712:
                if let fieldValueString = fieldValue as? String {
                    inAppPurchaseInfo.cancellationDate = parseDate(fieldValueString)
                }
            case 1711:
                inAppPurchaseInfo.webOrderLineItemId = (fieldValue as? Data)?.uint64Value
            default:
                break
            }
        }
        return inAppPurchaseInfo
    }

}

// MARK: ReceiptDateFormatter

/// Static formatting methods to use for string encoded date values in receipts
private enum ReceiptDateFormatter {

    /// Uses receipt-conform representation of dates like "2017-01-01T12:00:00Z",
    /// as a fallback, dates like "2017-01-01T12:00:00.123Z" are also parsed.
    static func date(from string: String) -> Date? {
        return self.defaultDateFormatter.date(from: string) // expected
            ?? self.fallbackDateFormatterWithMS.date(from: string) // try again with milliseconds
    }

    /// Uses receipt-conform representation of dates like "2017-01-01T12:00:00Z" (rfc3339 without millis)
    private static let defaultDateFormatter: DateFormatter = {
        let dateDateFormatter = DateFormatter()
        dateDateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateDateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZ"
        dateDateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        return dateDateFormatter
    }()

    /// Uses representation of dates like "2017-01-01T12:00:00.123Z"
    ///
    /// This is not the officially intended format, but added after hearing reports about new format adding ms https://twitter.com/depth42/status/1314179654811607041
    ///
    /// The formatting String was taken from https://github.com/IdeasOnCanvas/AppReceiptValidator/pull/73
    /// where tests were performed to check if it works
    private static let fallbackDateFormatterWithMS: DateFormatter = {
        let dateFormatter = DateFormatter()
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.dateFormat = "yyyy'-'MM'-'dd'T'HH':'mm':'ss'.'SSS'Z'"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        return dateFormatter
    }()
}
// swiftlint:enable all
