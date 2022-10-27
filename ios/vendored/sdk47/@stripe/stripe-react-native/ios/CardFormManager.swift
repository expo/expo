import Foundation

@objc(ABI47_0_0CardFormManager)
class CardFormManager: ABI47_0_0RCTViewManager {
    override func view() -> UIView! {
        let cardForm = CardFormView()
        let stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        stripeSdk?.cardFormView = cardForm;
        return cardForm
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func focus(_ abi47_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI47_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFormView = (viewRegistry![abi47_0_0ReactTag] as? CardFormView)!
            view.focus()
        }
    }
    
    @objc func blur(_ abi47_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI47_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFormView = (viewRegistry![abi47_0_0ReactTag] as? CardFormView)!
            view.blur()
        }
    }
}
