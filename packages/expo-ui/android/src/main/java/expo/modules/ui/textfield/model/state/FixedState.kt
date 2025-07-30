package expo.modules.ui.textfield.model.state

import expo.modules.ui.textfield.model.Next
import expo.modules.ui.textfield.model.State

/**
 * ### FixedState
 *
 * Represents characters in curly braces `{}`.
 *
 * Accepts every character but does not put it into the result string, unless the character equals
 * the one from the mask format. If it's not, inserts the symbol from the mask format into the
 * result.
 *
 * Always returns self as an extracted value.
 * @author taflanidi
 */
class FixedState(child: State?, val ownCharacter: Char) : State(child) {

    override fun accept(character: Char): Next? {
        return if (this.ownCharacter == character) {
            Next(
                this.nextState(),
                character,
                true,
                character
            )
        } else {
            Next(
                this.nextState(),
                this.ownCharacter,
                false,
                this.ownCharacter
            )
        }
    }

    override fun autocomplete(): Next? {
        return Next(
            this.nextState(),
            this.ownCharacter,
            false,
            this.ownCharacter
        )
    }

    override fun toString(): String {
        return "{" + this.ownCharacter + "} -> " + if (null == this.child) "null" else child.toString()
    }
}