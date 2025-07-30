package expo.modules.ui.textfield.model

/**
 * ### CaretString
 *
 * Model object that represents string with current cursor position.
 *
 * @author taflanidi
 */
data class CaretString(
    val string: String,
    val caretPosition: Int,
    val caretGravity: CaretGravity
) {
    fun reversed() =
        CaretString(
            this.string.reversed(),
            this.string.length - this.caretPosition,
            this.caretGravity
        )

    sealed class CaretGravity {
        class FORWARD(val autocompleteValue: Boolean) : CaretGravity()
        class BACKWARD(val autoskipValue: Boolean) : CaretGravity()

        val autocomplete: Boolean
            get() = when (this) {
                is FORWARD -> this.autocompleteValue
                else -> false
            }

        val autoskip: Boolean
            get() = when (this) {
                is BACKWARD -> this.autoskipValue
                else -> false
            }
    }
}
