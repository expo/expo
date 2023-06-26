//
//  PKPaymentPassFinder.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/6/22.
//

import Foundation

internal class PaymentPassFinder: NSObject {
    enum PassLocation: String {
        case CURRENT_DEVICE
        case PAIRED_DEVICE
    }
    
    class func findPassWith(
        primaryAccountIdentifier: String,
        hasPairedAppleWatch: Bool,
        completion: @escaping ((Bool, [PassLocation]) -> Void)
    ) {
        let existingPassOnDevice: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().passes(of: PKPassType.secureElement)
                    .first(where: { $0.secureElementPass?.primaryAccountIdentifier == primaryAccountIdentifier && $0.secureElementPass?.passActivationState != .deactivated && !$0.isRemotePass })
            } else {
                return PKPassLibrary().passes(of: PKPassType.payment)
                    .first(where: { $0.paymentPass?.primaryAccountIdentifier == primaryAccountIdentifier && $0.paymentPass?.passActivationState != .deactivated && !$0.isRemotePass })
            }
        }()
        
        var passLocations: [PassLocation] = []
        if (existingPassOnDevice != nil) {
            passLocations.append(.CURRENT_DEVICE)
        }
        
        // We're done here if the user does not have a paired Apple Watch
        if (!hasPairedAppleWatch) {
            completion(
                passLocations.count < 1,
                passLocations
            )
            return
        }
        
        let existingPassOnPairedDevices: PKPass? = {
            if #available(iOS 13.4, *) {
                return PKPassLibrary().remoteSecureElementPasses
                    .first(where: { $0.secureElementPass?.primaryAccountIdentifier == primaryAccountIdentifier && $0.secureElementPass?.passActivationState != .deactivated })
            } else {
                return PKPassLibrary().remotePaymentPasses()
                    .first(where: { $0.paymentPass?.primaryAccountIdentifier == primaryAccountIdentifier && $0.paymentPass?.passActivationState != .deactivated })
            }
        }()
        
        
        if (existingPassOnPairedDevices != nil) {
            passLocations.append(.PAIRED_DEVICE)
        }
        
        completion(
            passLocations.count < 2,
            passLocations
        )
    }
}
