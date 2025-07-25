//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### CaretStringIterator
 
 Iterates over CaretString.string characters. Each ``CaretStringIterator/next()`` call returns current character and adjusts iterator
 position.
 
 ``CaretStringIterator`` is used by the ``Mask`` instance to iterate over the string that should be formatted.
 */
class CaretStringIterator {
    
    let caretString: CaretString
    var currentIndex: String.Index
    
    /**
     Constructor
     
     - parameter caretString: ``CaretString`` object, over which the iterator is going to iterate.
     
     - returns: Initialized ``CaretStringIterator`` pointing at the beginning of provided ``CaretString/string``
     */
    init(caretString: CaretString) {
        self.caretString  = caretString
        self.currentIndex = self.caretString.string.startIndex
    }
    
    func insertionAffectsCaret() -> Bool {
        let currentIndex:  Int = self.caretString.string.distanceFromStartIndex(to: self.currentIndex)
        let caretPosition: Int = self.caretString.string.distanceFromStartIndex(to: self.caretString.caretPosition)
        
        switch self.caretString.caretGravity {
            case .backward:
                return self.currentIndex < self.caretString.caretPosition
            
            case .forward:
                return self.currentIndex <= self.caretString.caretPosition
                    || (0 == currentIndex && 0 == caretPosition)
        }
    }
    
    func deletionAffectsCaret() -> Bool {
        return self.currentIndex < self.caretString.caretPosition
    }
    
    /**
     Iterate over the ``CaretString/string``
     
     - postcondition: Iterator position is moved to the next symbol.
     
     - returns: Current symbol. If the iterator reached the end of the line, returns `nil`.
     */
    func next() -> Character? {
        if self.currentIndex >= self.caretString.string.endIndex {
            return nil
        }
        
        let character: Character = self.caretString.string[self.currentIndex]
        self.currentIndex = self.caretString.string.index(after: self.currentIndex)
        return character
    }
    
}
