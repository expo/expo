import Foundation

@objc(CardFieldManager)
class CardFieldManager: RCTViewManager, CardFieldDelegate {
    public let cardFieldMap: NSMutableDictionary = [:]

    func onDidCreateViewInstance(id: String, reference: Any?) -> Void {
        cardFieldMap[id] = reference
    }
    
    func onDidDestroyViewInstance(id: String) {
        cardFieldMap[id] = nil
    }
        
    public func getCardFieldReference(id: String) -> Any? {
        return self.cardFieldMap[id]
    }
    
    override func view() -> UIView! {
        // as it's reasonable we handle only one CardField component on the same screen
        if (cardFieldMap[CARD_FIELD_INSTANCE_ID] != nil) {
         // TODO: throw an exception
        }
        return CardFieldView(delegate: self)
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
