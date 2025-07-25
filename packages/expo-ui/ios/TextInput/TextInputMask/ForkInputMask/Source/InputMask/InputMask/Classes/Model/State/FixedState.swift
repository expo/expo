//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### FixedState
 
 Represents characters in curly braces `{}`.
 
 Accepts every character but does not put it into the result string, unless the character equals the one from the mask
 format. If it's not, inserts the symbol from the mask format into the result.
 
 Always returns self (own character) as an extracted value.
 */
class FixedState: MaskState {
    
    let ownCharacter: Character
    
    override func accept(character char: Character) -> Next? {
        if self.ownCharacter == char {
            return Next(
                state: self.nextState(),
                insert: char,
                pass: true,
                value: char
            )
        } else {
            return Next(
                state: self.nextState(),
                insert: self.ownCharacter,
                pass: false,
                value: self.ownCharacter
            )
        }
    }
    
    override func autocomplete() -> Next? {
        return Next(
            state: self.nextState(),
            insert: self.ownCharacter,
            pass: false,
            value: self.ownCharacter
        )
    }
    
    /**
     Constructor.
     
     - parameter child: next ``State``
     - parameter ownCharacter: the character in the curly braces `{}`
     
     - returns: Initialized ``FixedState`` instance.
     */
    init(
        child: MaskState,
        ownCharacter: Character
    ) {
        self.ownCharacter = ownCharacter
        super.init(child: child)
    }
    
    override var debugDescription: String {
        return "{\(self.ownCharacter)} -> " + (nil != self.child ? self.child!.debugDescription : "nil")
    }
    
}
