//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 Utility extension to make ``CharacterSet`` interact with ``Character`` instances.
 */
public extension CharacterSet {
    
    /**
     Implements ``CharacterSet/characterIsMember(:unichar)`` for ``Character`` instances.
     */
    func isMember(character: Character) -> Bool {
        let string: String = String(character)
        for char in string.unicodeScalars {
            if !self.contains(char) {
                return false
            }
        }
        
        return true
    }
    
}
