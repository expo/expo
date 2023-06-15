//
//  Tests.swift
//  Tests
//
//  Created by Charles Cruzan on 6/21/22.
//  Copyright © 2022 Facebook. All rights reserved.
//

import XCTest
@testable import stripe_react_native

class PushProvisioningTests: XCTestCase {
    func testCanAddCardToWalletInTestMode() throws {
        PushProvisioningUtils.canAddCardToWallet(primaryAccountIdentifier: "",
                                                 testEnv: true,
                                                 hasPairedAppleWatch: false) { canAddCard, status in
            XCTAssertEqual(canAddCard, true)
            XCTAssertEqual(status, nil)
        }
    }
    
    func testCanAddCardToWalletInLiveMode() throws {
        PushProvisioningUtils.canAddCardToWallet(primaryAccountIdentifier: "",
                                                 testEnv: false,
                                                 hasPairedAppleWatch: false) { canAddCard, status in
            XCTAssertEqual(canAddCard, false)
            XCTAssertEqual(status, PushProvisioningUtils.AddCardToWalletStatus.UNSUPPORTED_DEVICE)
        }
    }
    
    func testCanAddPaymentPassInTestMode() throws {
        XCTAssertEqual(
            PushProvisioningUtils.canAddPaymentPass(isTestMode: true),
            true
        )
    }
    
    func testCanAddPaymentPassInLiveMode() throws {
        XCTAssertEqual(
            PushProvisioningUtils.canAddPaymentPass(isTestMode: false),
            false
        )
    }
    
    func testCheckIfPassExists() throws {
        XCTAssertEqual(
            PushProvisioningUtils.getPassLocation(last4: "4242"),
            nil
        )
    }
}
