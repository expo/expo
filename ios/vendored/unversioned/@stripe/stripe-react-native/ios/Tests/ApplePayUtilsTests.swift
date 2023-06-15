//
//  Tests.swift
//  Tests
//
//  Created by Charles Cruzan on 6/21/22.
//  Copyright © 2022 Facebook. All rights reserved.
//

import XCTest
@testable import stripe_react_native
import PassKit

@available(iOS 15.0, *)
class ApplePayUtilsTests: XCTestCase {
    
    func test_buildPaymentSheetApplePayConfig_FailsWithoutMerchantIdentifier() throws {
        XCTAssertThrowsError(
            try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: nil, merchantCountryCode: "", paymentSummaryItems: nil, buttonType: nil, customHandlers: nil)
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.missingMerchantId
            )
        }
    }
    
    func test_buildPaymentSheetApplePayConfig_FailsWithoutCountryCode() throws {
        XCTAssertThrowsError(
            try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: nil, paymentSummaryItems: nil, buttonType: nil, customHandlers: nil)
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.missingCountryCode
            )
        }
    }
    
    func test_buildPaymentSheetApplePayConfig_withNilAndEmptyArray_shouldBeEqual() throws {
        let resultWithItemsAsNil = try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: TestFixtures.COUNTRY_CODE, paymentSummaryItems: nil, buttonType: nil, customHandlers: nil)
        let resultWithItemsAsEmptyArray = try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: TestFixtures.COUNTRY_CODE, paymentSummaryItems: [], buttonType: nil, customHandlers: nil)
        XCTAssertEqual(resultWithItemsAsNil.paymentSummaryItems, resultWithItemsAsEmptyArray.paymentSummaryItems)
    }
    
    func test_buildPaymentSheetApplePayConfig_withItems_shouldMatchExpected() throws {
        let result = try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: TestFixtures.COUNTRY_CODE, paymentSummaryItems: TestFixtures.CART_ITEM_DICTIONARY, buttonType: nil, customHandlers: nil)
        
        let deferredItemResult = PKDeferredPaymentSummaryItem(label: "deferred label", amount: 1.00)
        deferredItemResult.deferredDate = Date(timeIntervalSince1970: 123456789)
        let immediateItemResult = PKPaymentSummaryItem(label: "immediate label", amount: 2.00, type: .pending)
        let recurringResult = PKRecurringPaymentSummaryItem(label: "recurring label", amount: 1.00)
        recurringResult.intervalUnit = .minute
        recurringResult.intervalCount = 2
        recurringResult.startDate = Date(timeIntervalSince1970: 123456789)
        recurringResult.endDate = Date(timeIntervalSince1970: 234567890)
        
        XCTAssertEqual(
            result.paymentSummaryItems,
            [deferredItemResult, immediateItemResult, recurringResult]
        )
        XCTAssertEqual(
            result.merchantId,
            TestFixtures.MERCHANT_ID
        )
        XCTAssertEqual(
            result.merchantCountryCode,
            TestFixtures.COUNTRY_CODE
        )
    }
    
    func test_createDeferredPaymentSummaryItem() throws {
        let result = try ApplePayUtils.createDeferredPaymentSummaryItem(item: TestFixtures.DEFERRED_CART_ITEM_DICTIONARY)
        
        let expectedResult = PKDeferredPaymentSummaryItem(label: "deferred label", amount: 1.00)
        expectedResult.deferredDate = Date(timeIntervalSince1970: 123456789)
        
        XCTAssertEqual(
            result,
            expectedResult
        )
    }
    
    func test_createRecurringPaymentSummaryItem() throws {
        let result = try ApplePayUtils.createRecurringPaymentSummaryItem(item: TestFixtures.RECURRING_CART_ITEM_DICTIONARY)
        
        let expectedResult = PKRecurringPaymentSummaryItem(label: "recurring label", amount: 1.00)
        expectedResult.intervalUnit = .minute
        expectedResult.intervalCount = 2
        expectedResult.startDate = Date(timeIntervalSince1970: 123456789)
        expectedResult.endDate = Date(timeIntervalSince1970: 234567890)
        
        XCTAssertEqual(
            result,
            expectedResult
        )
    }
    
    func test_createRecurringPaymentSummaryItem_withUnexpectedIntervalUnit_fails() throws {
        XCTAssertThrowsError(
            try ApplePayUtils.createRecurringPaymentSummaryItem(item: [
                "paymentType":"Recurring",
                "intervalUnit": "decade",
                "intervalCount": 1,
            ] as [String : Any])
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.invalidTimeInterval("decade")
            )
        }
        
        XCTAssertThrowsError(
            try ApplePayUtils.createRecurringPaymentSummaryItem(item: [
                "paymentType":"Recurring",
                "intervalCount": 1,
            ] as [String : Any])
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.invalidTimeInterval("null")
            )
        }
    }
    
    func test_createImmediatePaymentSummaryItem() throws {
        let result = ApplePayUtils.createImmediatePaymentSummaryItem(item: TestFixtures.IMMEDIATE_CART_ITEM_DICTIONARY_NOT_PENDING)
        
        let expectedResult = PKPaymentSummaryItem(label: "immediate label", amount: 2.00, type: .final)
        
        XCTAssertEqual(
            result,
            expectedResult
        )
    }
    
    func test_buildPaymentSummaryItems() throws {
        let result = try ApplePayUtils.buildPaymentSummaryItems(items: TestFixtures.CART_ITEM_DICTIONARY)
        let deferredItemResult = PKDeferredPaymentSummaryItem(label: "deferred label", amount: 1.00)
        deferredItemResult.deferredDate = Date(timeIntervalSince1970: 123456789)
        let immediateItemResult = PKPaymentSummaryItem(label: "immediate label", amount: 2.00, type: .pending)
        let recurringResult = PKRecurringPaymentSummaryItem(label: "recurring label", amount: 1.00)
        recurringResult.intervalUnit = .minute
        recurringResult.intervalCount = 2
        recurringResult.startDate = Date(timeIntervalSince1970: 123456789)
        recurringResult.endDate = Date(timeIntervalSince1970: 234567890)
        
        XCTAssertEqual(
            result,
            [deferredItemResult, immediateItemResult, recurringResult]
        )
    }
    
    func test_buildPaymentSummaryItems_unexpectedType_fails() throws {
        XCTAssertThrowsError(
            try ApplePayUtils.buildPaymentSummaryItems(items: [[
                "paymentType":"wrong type",
            ]] as [[String : Any]])
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.invalidCartSummaryItemType("wrong type")
            )
        }
        
        XCTAssertThrowsError(
            try ApplePayUtils.buildPaymentSummaryItems(items: [[
                "paymentType":"",
            ]] as [[String : Any]])
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.invalidCartSummaryItemType("")
            )
        }
        
        XCTAssertThrowsError(
            try ApplePayUtils.buildPaymentSummaryItems(items: [[
                "label":"my labal",
            ]] as [[String : Any]])
        ) { error in
            XCTAssertEqual(
                error as! ApplePayUtilsError, ApplePayUtilsError.invalidCartSummaryItemType("null")
            )
        }
    }
    
    func test_buildPaymentSheetApplePayConfig_withNilButtonType_shouldBePlain() throws {
        let result = try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: TestFixtures.COUNTRY_CODE, paymentSummaryItems: nil, buttonType: nil, customHandlers: nil)
        XCTAssertEqual(result.buttonType, .plain)
    }
    
    func test_buildPaymentSheetApplePayConfig_withButtonType4_shouldBeDonate() throws {
        let result = try ApplePayUtils.buildPaymentSheetApplePayConfig(merchantIdentifier: TestFixtures.MERCHANT_ID, merchantCountryCode: TestFixtures.COUNTRY_CODE, paymentSummaryItems: nil, buttonType: 4, customHandlers: nil)
        XCTAssertEqual(result.buttonType, .donate)
    }
    
    private struct TestFixtures {
        static let MERCHANT_ID = "merchant.com.id"
        static let COUNTRY_CODE = "US"
        static let DEFERRED_CART_ITEM_DICTIONARY = [
            "paymentType":"Deferred",
            "deferredDate": 123456789 as NSNumber,
            "label": "deferred label",
            "amount": "1.00"
        ] as [String : Any]
        static let RECURRING_CART_ITEM_DICTIONARY = [
            "paymentType":"Recurring",
            "intervalUnit": "minute",
            "intervalCount": 2,
            "startDate": 123456789 as NSNumber,
            "endDate": 234567890 as NSNumber,
            "label": "recurring label",
            "amount": "1.00"
        ] as [String : Any]
        static let IMMEDIATE_CART_ITEM_DICTIONARY = [
            "paymentType":"Immediate",
            "isPending": true,
            "label": "immediate label",
            "amount": "2.00"
        ] as [String : Any]
        static let CART_ITEM_DICTIONARY = [
            DEFERRED_CART_ITEM_DICTIONARY, IMMEDIATE_CART_ITEM_DICTIONARY, RECURRING_CART_ITEM_DICTIONARY
        ]
        static let IMMEDIATE_CART_ITEM_DICTIONARY_NOT_PENDING = [
            "paymentType":"Immediate",
            "label": "immediate label",
            "amount": "2.00"
        ] as [String : Any]
    }
}
