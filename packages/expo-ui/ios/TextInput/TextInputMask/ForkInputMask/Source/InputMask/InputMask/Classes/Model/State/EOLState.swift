//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### EOLState
 
 End-of-line state. Serves as mask format terminator character.
 
 Does not accept any character. Always returns `self` as the next state, ignoring the child state given during
 initialization.
 */
class EOLState: MaskState {
    
    convenience init() {
        self.init(child: nil)
    }
    
    override init(child: MaskState?) {
        super.init(child: nil)
    }
    
    override func nextState() -> MaskState {
        return self
    }
    
    override func accept(character char: Character) -> Next? {
        return nil
    }
    
    override var debugDescription: String {
        return "EOL"
    }
    
}
