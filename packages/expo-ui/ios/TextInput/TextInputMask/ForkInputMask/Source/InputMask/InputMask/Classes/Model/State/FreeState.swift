//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### FreeState
 
 Represents "free" characters outside square and curly brackets.
 
 Accepts every character but does not put it into the result string, unless the character equals the one from the mask
 format. If it's not, inserts the symbol from the mask format into the result.
 
 Always returns `nil` as an extracted value, does not affect the resulting value.
 */
class FreeState: MaskState {
    
    let ownCharacter: Character
    
    override func accept(character char: Character) -> Next? {
        if self.ownCharacter == char {
            return Next(
                state: self.nextState(),
                insert: char,
                pass: true,
                value: nil
            )
        } else {
            return Next(
                state: self.nextState(),
                insert: self.ownCharacter,
                pass: false,
                value: nil
            )
        }
    }
    
    override func autocomplete() -> Next? {
        return Next(
            state: self.nextState(),
            insert: self.ownCharacter,
            pass: false,
            value: nil
        )
    }
    
    /**
     Constructor.
     
     - parameter child: next ``State``
     - parameter ownCharacter: represented "free" character
     
     - returns: Initialized ``FreeState`` instance.
     */
    init(
        child: MaskState,
        ownCharacter: Character
    ) {
        self.ownCharacter = ownCharacter
        super.init(child: child)
    }
    
    override var debugDescription: String {
        return "\(self.ownCharacter) -> " + (nil != self.child ? self.child!.debugDescription : "nil")
    }
    
}
