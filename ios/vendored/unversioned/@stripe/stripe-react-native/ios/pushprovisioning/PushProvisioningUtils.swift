//
//  PushProvisioningUtils.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 6/9/22.
//

import Foundation
import Stripe

internal class PushProvisioningUtils {
    class func canAddCardToWallet(
        last4: String,
        primaryAccountIdentifier: String,
        testEnv: Bool
    ) -> (canAddCard: Bool, status: AddCardToWalletStatus?) {
        if (!PKAddPassesViewController.canAddPasses()) {
            return (false, AddCardToWalletStatus.UNSUPPORTED_DEVICE)
        }
        
        var status : AddCardToWalletStatus? = nil
        var canAddCard = PushProvisioningUtils.canAddPaymentPass(
            primaryAccountIdentifier: primaryAccountIdentifier,
            isTestMode: testEnv)
        
        if (!canAddCard) {
            status = AddCardToWalletStatus.MISSING_CONFIGURATION
        } else if (PushProvisioningUtils.passExistsWith(last4: last4)) {
            canAddCard = false
            status = AddCardToWalletStatus.CARD_ALREADY_EXISTS
        }

        return (canAddCard, status)
    }
    
    class func canAddPaymentPass(primaryAccountIdentifier: String, isTestMode: Bool) -> Bool {
        if (isTestMode) {
            return STPFakeAddPaymentPassViewController.canAddPaymentPass()
        }
        
        if #available(iOS 13.4, *) {
            return PKPassLibrary().canAddSecureElementPass(primaryAccountIdentifier: primaryAccountIdentifier)
        } else {
            return PKAddPaymentPassViewController.canAddPaymentPass()
        }
    }
    
    class func passExistsWith(last4: String) -> Bool {
        let existingPass: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().passes(of: PKPassType.secureElement).first(where: {$0.secureElementPass?.primaryAccountNumberSuffix == last4})
            } else {
                return PKPassLibrary().passes(of: PKPassType.payment).first(where: {$0.paymentPass?.primaryAccountNumberSuffix == last4})
            }
        }()
        return existingPass != nil
    }
    
    enum AddCardToWalletStatus: String {
        case UNSUPPORTED_DEVICE
        case MISSING_CONFIGURATION
        case CARD_ALREADY_EXISTS
    }
}
