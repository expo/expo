package expo.modules.ui.textfield.model

/**
 * ### State
 *
 * State of the mask, similar to the state in regular expressions.
 * Each state represents a character from the mask format string.
 *
 * @author taflanidi
 */
abstract class State(val child: State?) {

    /**
     * Abstract method.
     *
     * Defines, whether the state accepts user input character or not, and which actions should take
     * place when the character is accepted.
     *
     * @param character character from the user input string.
     *
     * @returns ``Next`` object instance with a set of actions that should take place when the user
     * input character is accepted.
     *
     * @throws Fatal error, if the method is not implemented.
     */
    abstract fun accept(character: Char): Next?

    /**
     * Automatically complete user input.
     *
     * @returns ``Next`` object instance with a set of actions to complete user input. If no
     * autocomplete available, returns `null`.
     */
    open fun autocomplete(): Next? {
        return null
    }

    /**
     * Obtain the next state.
     *
     * Sometimes it is necessary to override this behavior. For instance, ``State`` may want to
     * return ``self`` as the next state under certain conditions.
     *
     * @returns ``State`` object.
     */
    open fun nextState(): State {
        return this.child!!
    }

    override fun toString(): String {
        return "BASE -> " + if (null != this.child) this.child.toString() else "null"
    }
}