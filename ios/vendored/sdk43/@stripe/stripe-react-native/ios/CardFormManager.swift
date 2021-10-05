import Foundation

@objc(ABI43_0_0CardFormManager)
class CardFormManager: ABI43_0_0RCTViewManager {
    override func view() -> UIView! {
        let cardForm = CardFormView()
        let stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        stripeSdk?.cardFormView = cardForm;
        return cardForm
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func focus(_ abi43_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI43_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFormView = (viewRegistry![abi43_0_0ReactTag] as? CardFormView)!
            view.focus()
        }
    }
    
    @objc func blur(_ abi43_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI43_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFormView = (viewRegistry![abi43_0_0ReactTag] as? CardFormView)!
            view.blur()
        }
    }
}
