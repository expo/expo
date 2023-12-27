import Foundation

@objc(CellContainerManager)
class CellContainerManager: RCTViewManager {  
    override func view() -> UIView! {
        return CellContainer()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
