//
//  AddToWalletButtonManager.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 3/28/22.
//

import Foundation

@objc(AddToWalletButtonManager)
class AddToWalletButtonManager : RCTViewManager {
    override func view() -> UIView! {
        return AddToWalletButtonView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
