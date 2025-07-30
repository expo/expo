package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.model.CaretString

/**
 * ### CaretStringIterator
 *
 * Iterates over CaretString.string characters. Each `next()` call returns current character and
 * adjusts iterator position.
 *
 * ``CaretStringIterator`` is used by the ``Mask`` instance to iterate over the string that
 * should be formatted.
 *
 * @author taflanidi
 */
open class CaretStringIterator(
    protected val caretString: CaretString,
    protected var currentIndex: Int = 0
) {

    open fun insertionAffectsCaret(): Boolean {
        return when (this.caretString.caretGravity) {
            is CaretString.CaretGravity.BACKWARD -> this.currentIndex < this.caretString.caretPosition
            is CaretString.CaretGravity.FORWARD -> this.currentIndex <= this.caretString.caretPosition
                || (0 == this.currentIndex && 0 == this.caretString.caretPosition)
        }
    }

    open fun deletionAffectsCaret(): Boolean {
        return this.currentIndex < this.caretString.caretPosition
    }

    /**
     * Iterate over the ```CaretString.string```
     * @postcondition: Iterator position is moved to the next symbol.
     * @returns Current symbol. If the iterator reached the end of the line, returns ```nil```.
     */
    open fun next(): Char? {
        if (this.currentIndex >= this.caretString.string.length) {
            return null
        }

        val char: Char = this.caretString.string.toCharArray()[this.currentIndex]
        this.currentIndex += 1
        return char
    }

}
