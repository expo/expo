import Foundation

@objc(ABI48_0_0CardFieldManager)
class CardFieldManager: ABI48_0_0RCTViewManager {
    override func view() -> UIView! {
        let cardField = CardFieldView()
        let stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        stripeSdk?.cardFieldView = cardField;
        return cardField
    }
    
    @objc func focus(_ abi48_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI48_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi48_0_0ReactTag] as? CardFieldView)!
            view.focus()
        }
    }
    
    @objc func blur(_ abi48_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI48_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi48_0_0ReactTag] as? CardFieldView)!
            view.blur()
        }
    }
    
    @objc func clear(_ abi48_0_0ReactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: ABI48_0_0RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![abi48_0_0ReactTag] as? CardFieldView)!
            view.clear()
        }
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
