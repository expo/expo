//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### OptionalValueState
 
 Represents optional characters in square brackets `[]`.
 
 Accepts any characters, but puts into the result string only the characters of own type (see ``OptionalValueState/StateType-swift.enum``).
 
 Returns accepted characters of own type as an extracted value.
 
 - seealso: ``OptionalValueState/StateType-swift.enum``
 */
class OptionalValueState: MaskState {
    
    /**
     ### StateType
     
     * ``numeric`` stands for [9] characters
     * ``literal`` stands for [a] characters
     * ``alphaNumeric`` stands for [-] characters
     * ``custom`` stands for characters of custom notation
     */
    enum StateType {
        case numeric
        case literal
        case alphaNumeric
        case custom(char: Character, characterSet: CharacterSet)
    }
    
    let type: StateType
    
    func accepts(character char: Character) -> Bool {
        switch self.type {
            case .numeric:
                return CharacterSet.decimalDigits.isMember(character: char)
            case .literal:
                return CharacterSet.letters.isMember(character: char)
            case .alphaNumeric:
                return CharacterSet.alphanumerics.isMember(character: char)
            case .custom(_, let characterSet):
                return characterSet.isMember(character: char)
        }
    }
    
    override func accept(character char: Character) -> Next? {
        if self.accepts(character: char) {
            return Next(
                state: self.nextState(),
                insert: char,
                pass: true,
                value: char
            )
        } else {
            return Next(
                state: self.nextState(),
                insert: nil,
                pass: false,
                value: nil
            )
        }
    }
    
    /**
     Constructor.
     
     - parameter child: next ``State``
     - parameter type: type of the accepted characters
     
     - seealso: ``OptionalValueState/StateType-swift.enum``
     
     - returns: Initialized ``OptionalValueState`` instance.
     */
    init(
        child: MaskState,
        type: StateType
    ) {
        self.type = type
        super.init(child: child)
    }
    
    override var debugDescription: String {
        switch self.type {
            case .literal:
                return "[a] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .numeric:
                return "[9] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .alphaNumeric:
                return "[-] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .custom(let char, _):
                return "[\(char)] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
        }
    }
    
}
