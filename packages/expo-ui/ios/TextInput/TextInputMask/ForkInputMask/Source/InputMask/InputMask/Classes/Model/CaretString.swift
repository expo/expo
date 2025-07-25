//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### CaretString
 
 Model object that represents string with current cursor position.
 */
public struct CaretString: CustomDebugStringConvertible, CustomStringConvertible, Equatable {
    
    /**
     Text from the user.
     */
    public let string: String
    
    /**
     Cursor position from the input text field.
     */
    public let caretPosition: String.Index
    
    /**
     When ``Mask`` puts additional characters at caret position, the caret moves in this direction.
     
     Caret usually has a ``CaretGravity-swift.enum/forward(autocomplete:)`` gravity, unless this ``CaretString`` is a result of deletion/backspacing.
     */
    public let caretGravity: CaretGravity
    
    /**
     Constructor.
     
     - parameter string: text from the user.
     - parameter caretPosition: cursor position from the input text field.
     - parameter caretGravity: caret tends to move in this direction during ``Mask`` insertions at caret position.
     */
    public init(string: String, caretPosition: String.Index, caretGravity: CaretGravity) {
        self.string        = string
        self.caretPosition = caretPosition
        self.caretGravity  = caretGravity
    }

    public var debugDescription: String {
        return "STRING: \(self.string)\nCARET POSITION: \(self.caretPosition)\nCARET GRAVITY: \(self.caretGravity)"
    }
    
    public var description: String {
        return self.debugDescription
    }

    /**
     Creates a reversed ``CaretString`` instance with reversed string and corresponding caret position.
     */
    func reversed() -> CaretString {
        let reversedString:        String       = self.string.reversed
        let caretPositionInt:      Int          = self.string.distanceFromStartIndex(to: self.caretPosition)
        let reversedCaretPosition: String.Index = reversedString.startIndex(offsetBy: self.string.count - caretPositionInt)
        return CaretString(
            string: reversedString,
            caretPosition: reversedCaretPosition,
            caretGravity: self.caretGravity
        )
    }
    
    /**
     When ``Mask`` puts additional characters at caret position, the caret moves in this direction.
     */
    public enum CaretGravity: Equatable {
        /**
         Put additional characters before caret, thus move caret forward.
         */
        case forward(autocomplete: Bool)
        
        /**
         Put additional characters after caret, thus caret won't move.
         */
        case backward(autoskip: Bool)
        
        /**
         Autocomplete, if possible.
         */
        var autocomplete: Bool {
            if case CaretGravity.forward(let autocomplete) = self {
                return autocomplete
            }
            return false
        }
        
        /**
         Autoskip, if possible.
         */
        var autoskip: Bool {
            if case CaretGravity.backward(let autoskip) = self {
                return autoskip
            }
            return false
        }
    }
    
}


public func ==(left: CaretString, right: CaretString) -> Bool {
    return left.caretPosition == right.caretPosition
        && left.string        == right.string
        && left.caretGravity  == right.caretGravity
}
