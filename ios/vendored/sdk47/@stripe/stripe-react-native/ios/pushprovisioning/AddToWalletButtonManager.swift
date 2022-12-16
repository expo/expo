//
//  AddToWalletButtonManager.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

import Foundation

@objc(ABI47_0_0AddToWalletButtonManager)
class AddToWalletButtonManager : ABI47_0_0RCTViewManager {
    override func view() -> UIView! {
        return AddToWalletButtonView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
