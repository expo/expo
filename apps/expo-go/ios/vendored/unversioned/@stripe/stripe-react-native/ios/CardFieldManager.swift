import Foundation

@objc(CardFieldManager)
class CardFieldManager: RCTViewManager {
    override func view() -> UIView! {
        let cardField = CardFieldView()
        let stripeSdk = bridge.module(forName: "StripeSdk") as? StripeSdk
        stripeSdk?.cardFieldView = cardField;
        return cardField
    }
    
    @objc func focus(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![reactTag] as? CardFieldView)!
            view.focus()
        }
    }
    
    @objc func blur(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![reactTag] as? CardFieldView)!
            view.blur()
        }
    }
    
    @objc func clear(_ reactTag: NSNumber) {
        self.bridge!.uiManager.addUIBlock { (_: RCTUIManager?, viewRegistry: [NSNumber: UIView]?) in
            let view: CardFieldView = (viewRegistry![reactTag] as? CardFieldView)!
            view.clear()
        }
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
