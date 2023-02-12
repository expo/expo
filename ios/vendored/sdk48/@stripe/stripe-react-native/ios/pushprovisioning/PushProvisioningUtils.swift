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
        testEnv: Bool,
        hasPairedAppleWatch: Bool,
        completion: @escaping (_ canAddCard: Bool, _ status: AddCardToWalletStatus?) -> Void
    ) {
        if (!PKAddPassesViewController.canAddPasses()) {
            completion(false, AddCardToWalletStatus.UNSUPPORTED_DEVICE)
        }
        
        let canAddCard = canAddPaymentPass(
            primaryAccountIdentifier: primaryAccountIdentifier,
            isTestMode: testEnv)
        
        if (!canAddCard) {
            completion(canAddCard, AddCardToWalletStatus.MISSING_CONFIGURATION)
        } else {
            PaymentPassFinder.findPassWithLast4(last4: last4, hasPairedAppleWatch: hasPairedAppleWatch) { canAddCardToADevice, passLocations in
                var status: AddCardToWalletStatus? = nil
                if (!canAddCardToADevice) {
                    status = AddCardToWalletStatus.CARD_ALREADY_EXISTS
                } else if (passLocations.contains(.PAIRED_DEVICE)) {
                    status = AddCardToWalletStatus.CARD_EXISTS_ON_PAIRED_DEVICE
                } else if (passLocations.contains(.CURRENT_DEVICE)) {
                    status = AddCardToWalletStatus.CARD_EXISTS_ON_CURRENT_DEVICE
                }
                completion(canAddCardToADevice, status)
            }
        }
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
    
    class func getPassLocation(last4: String) -> PaymentPassFinder.PassLocation? {
        let existingPassOnDevice: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().passes(of: PKPassType.secureElement)
                    .first(where: { $0.secureElementPass?.primaryAccountNumberSuffix == last4 && $0.secureElementPass?.passActivationState != .suspended && !$0.isRemotePass })
            } else {
                return PKPassLibrary().passes(of: PKPassType.payment)
                    .first(where: { $0.paymentPass?.primaryAccountNumberSuffix == last4 && $0.paymentPass?.passActivationState != .suspended && !$0.isRemotePass })
            }
        }()
        
        let existingPassOnPairedDevices: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().remoteSecureElementPasses
                    .first(where: { $0.secureElementPass?.primaryAccountNumberSuffix == last4 && $0.secureElementPass?.passActivationState != .suspended })
            } else {
                return PKPassLibrary().remotePaymentPasses()
                    .first(where: { $0.paymentPass?.primaryAccountNumberSuffix == last4 && $0.paymentPass?.passActivationState != .suspended })
            }
        }()
        
        return existingPassOnDevice != nil ? PaymentPassFinder.PassLocation.CURRENT_DEVICE : (existingPassOnPairedDevices != nil ? PaymentPassFinder.PassLocation.PAIRED_DEVICE : nil)
    }
    
    enum AddCardToWalletStatus: String {
        case UNSUPPORTED_DEVICE
        case MISSING_CONFIGURATION
        case CARD_ALREADY_EXISTS
        case CARD_EXISTS_ON_CURRENT_DEVICE
        case CARD_EXISTS_ON_PAIRED_DEVICE
    }
}
