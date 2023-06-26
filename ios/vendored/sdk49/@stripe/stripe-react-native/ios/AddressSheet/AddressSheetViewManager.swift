//
//  AddressSheetViewManager.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

import Foundation

@objc(ABI49_0_0AddressSheetViewManager)
class AddressSheetViewManager : ABI49_0_0RCTViewManager {
    override func view() -> UIView! {
        return AddressSheetView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
