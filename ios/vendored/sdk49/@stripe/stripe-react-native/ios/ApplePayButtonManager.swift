import Foundation

@objc(ABI49_0_0ApplePayButtonManager)
class ApplePayButtonManager: ABI49_0_0RCTViewManager {
    override func view() -> UIView! {
        let view = ApplePayButtonView(frame: CGRect.init())
        view.stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        return view
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
