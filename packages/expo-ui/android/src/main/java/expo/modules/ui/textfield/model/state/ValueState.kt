package expo.modules.ui.textfield.model.state

import expo.modules.ui.textfield.model.Next
import expo.modules.ui.textfield.model.State

/**
 * ### ValueState
 *
 * Represents mandatory characters in square brackets `[]`.
 *
 * Accepts only characters of own type (see ``StateType``). Puts accepted characters into the
 * result string.
 *
 * Returns accepted characters as an extracted value.
 *
 * @see ``ValueState.StateType``
 *
 * @author taflanidi
 */
class ValueState : State {

    /**
     * ### StateType
     *
     * `Numeric` stands for `[9]` characters
     * `Literal` stands for `[a]` characters
     * `AlphaNumeric` stands for `[-]` characters
     * `Ellipsis` stands for `[…]` characters
     */
    sealed class StateType {
        class Numeric : StateType()
        class Literal : StateType()
        class AlphaNumeric : StateType()
        class Ellipsis(val inheritedType: StateType) : StateType()
        class Custom(val character: Char, val characterSet: String) : StateType()
    }

    val type: StateType

    /**
     * Constructor for elliptical ``ValueState``
     */
    constructor(inheritedType: StateType) : super(null) {
        this.type = StateType.Ellipsis(inheritedType)
    }

    constructor(child: State?, type: StateType) : super(child) {
        this.type = type
    }

    private fun accepts(character: Char): Boolean {
        return when (this.type) {
            is StateType.Numeric -> character.isDigit()
            is StateType.Literal -> character.isLetter()
            is StateType.AlphaNumeric -> character.isLetterOrDigit()
            is StateType.Ellipsis -> when (this.type.inheritedType) {
                is StateType.Numeric -> character.isDigit()
                is StateType.Literal -> character.isLetter()
                is StateType.AlphaNumeric -> character.isLetterOrDigit()
                is StateType.Custom -> this.type.inheritedType.characterSet.contains(character)
                else -> false
            }
            is StateType.Custom -> this.type.characterSet.contains(character)
        }
    }

    override fun accept(character: Char): Next? {
        if (!this.accepts(character)) return null

        return Next(
            this.nextState(),
            character,
            true,
            character
        )
    }

    val isElliptical: Boolean
        get() = when (this.type) {
            is StateType.Ellipsis -> true
            else -> false
        }

    override fun nextState(): State = when (this.type) {
        is StateType.Ellipsis -> this
        else -> super.nextState()
    }

    override fun toString(): String {
        return when (this.type) {
            is StateType.Literal -> "[A] -> " + if (null == this.child) "null" else child.toString()
            is StateType.Numeric -> "[0] -> " + if (null == this.child) "null" else child.toString()
            is StateType.AlphaNumeric -> "[_] -> " + if (null == this.child) "null" else child.toString()
            is StateType.Ellipsis -> "[…] -> " + if (null == this.child) "null" else child.toString()
            is StateType.Custom -> "[" + this.type.character + "] -> " + if (null == this.child) "null" else child.toString()
        }
    }

}
