//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### ValueState
 
 Represents mandatory characters in square brackets `[]`.
 
 Accepts only characters of own type (see ``ValueState/StateType-swift.enum``). Puts accepted characters into the result string.
 
 Returns accepted characters as an extracted value.
 
 - seealso: ``ValueState/StateType-swift.enum``
 */
class ValueState: MaskState {
    
    /**
     ### StateType
     
     * ``numeric`` stands for [9] characters
     * ``literal`` stands for [a] characters
     * ``alphaNumeric`` stands for [-] characters
     * ``ellipsis`` stands for […] characters
     * ``custom`` stands for characters of custom notation
     */
    indirect enum StateType {
        case numeric
        case literal
        case alphaNumeric
        case ellipsis(inheritedType: StateType)
        case custom(char: Character, characterSet: CharacterSet)
        
        var characterSet: CharacterSet {
            switch self {
                case .numeric: return CharacterSet.decimalDigits
                case .literal: return CharacterSet.letters
                case .alphaNumeric: return CharacterSet.alphanumerics
                case .ellipsis(let inheritedType): return inheritedType.characterSet
                case .custom(_, let characterSet): return characterSet
            }
        }
    }
    
    let type: StateType
    
    var isElliptical: Bool {
        if case StateType.ellipsis = self.type {
            return true
        }
        return false
    }
    
    func accepts(character char: Character) -> Bool {
        return self.type.characterSet.isMember(character: char)
    }
    
    override func accept(character char: Character) -> Next? {
        if !self.accepts(character: char) {
            return nil
        }
        
        return Next(
            state: self.nextState(),
            insert: char,
            pass: true,
            value: char
        )
    }
    
    override func nextState() -> MaskState {
        if case StateType.ellipsis = self.type {
            return self
        }
        return super.nextState()
    }
    
    /**
     Constructor.
     
     - parameter child: next ``State``
     - parameter type: type of the accepted characters
     
     - seealso: ``ValueState/StateType-swift.enum``
     
     - returns: Initialized ``ValueState`` instance.
     */
    init(
        child: MaskState,
        type: StateType
    ) {
        self.type = type
        super.init(child: child)
    }
    
    /**
     Constructor for elliptical ``ValueState``
     */
    init(inheritedType: StateType) {
        self.type = StateType.ellipsis(inheritedType: inheritedType)
        super.init(child: nil)
    }
    
    override var debugDescription: String {
        switch self.type {
            case .literal:
                return "[A] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .numeric:
                return "[0] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .alphaNumeric:
                return "[_] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .ellipsis:
                return "[…] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
            case .custom(let char, _):
                return "[\(char)] -> " + (nil != self.child ? self.child!.debugDescription : "nil")
        }
    }
    
}
