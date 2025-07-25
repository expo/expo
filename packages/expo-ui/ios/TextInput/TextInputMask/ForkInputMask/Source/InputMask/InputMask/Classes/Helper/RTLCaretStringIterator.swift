//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


class RTLCaretStringIterator: CaretStringIterator {
    override func insertionAffectsCaret() -> Bool {
        return self.currentIndex <= self.caretString.caretPosition
    }
}
