package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.model.CaretString

class RTLCaretStringIterator(caretString: CaretString) : CaretStringIterator(caretString) {
    override fun insertionAffectsCaret(): Boolean {
        return this.currentIndex <= this.caretString.caretPosition
    }
}