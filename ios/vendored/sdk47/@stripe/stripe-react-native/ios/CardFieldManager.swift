import Foundation

@objc(ABI47_0_0CardFieldManager)
class CardFieldManager: ABI47_0_0RCTViewManager {
    override func view() -> UIView! {
        let cardField = CardFieldView()
        let stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        stripeSdk?.cardFieldView = cardField;
        return cardField
    }
    
    @objc func focus(_ abi47_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI47_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi47_0_0ReactTag] as? CardFieldView)!
            view.focus()
        }
    }
    
    @objc func blur(_ abi47_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI47_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi47_0_0ReactTag] as? CardFieldView)!
            view.blur()
        }
    }
    
    @objc func clear(_ abi47_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI47_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi47_0_0ReactTag] as? CardFieldView)!
            view.clear()
        }
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
