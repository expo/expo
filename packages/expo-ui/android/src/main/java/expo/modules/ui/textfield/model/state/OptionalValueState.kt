package expo.modules.ui.textfield.model.state

import expo.modules.ui.textfield.model.Next
import expo.modules.ui.textfield.model.State

/**
 * ### OptionalValueState
 *
 * Represents optional characters in square brackets `[]`.
 *
 * Accepts any characters, but puts into the result string only the characters of own type
 * (see ``StateType``).
 *
 * Returns accepted characters of own type as an extracted value.
 *
 * @see ``OptionalValueState.StateType``
 *
 * @author taflanidi
 */
class OptionalValueState(child: State, val type: StateType) : State(child) {

    sealed class StateType {
        class Numeric : StateType()
        class Literal : StateType()
        class AlphaNumeric : StateType()
        class Custom(val character: Char, val characterSet: String) : StateType()
    }

    private fun accepts(character: Char): Boolean {
        return when (this.type) {
            is StateType.Numeric -> character.isDigit()
            is StateType.Literal -> character.isLetter()
            is StateType.AlphaNumeric -> character.isLetterOrDigit()
            is StateType.Custom -> this.type.characterSet.contains(character)
        }
    }

    override fun accept(character: Char): Next? {
        return if (this.accepts(character)) {
            Next(
                this.nextState(),
                character,
                true,
                character
            )
        } else {
            Next(
                this.nextState(),
                null,
                false,
                null
            )
        }
    }

    override fun toString(): String {
        return when (this.type) {
            is StateType.Literal -> "[a] -> " + if (null == this.child) "null" else child.toString()
            is StateType.Numeric -> "[9] -> " + if (null == this.child) "null" else child.toString()
            is StateType.AlphaNumeric -> "[-] -> " + if (null == this.child) "null" else child.toString()
            is StateType.Custom -> "[" + this.type.character + "] -> " + if (null == this.child) "null" else child.toString()
        }
    }
}