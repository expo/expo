//
//  AddressSheetViewManager.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 10/11/22.
//

import Foundation

@objc(AddressSheetViewManager)
class AddressSheetViewManager : RCTViewManager {
    override func view() -> UIView! {
        return AddressSheetView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
