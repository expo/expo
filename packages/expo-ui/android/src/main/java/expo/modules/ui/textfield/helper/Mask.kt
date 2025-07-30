package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Next
import expo.modules.ui.textfield.model.Notation
import expo.modules.ui.textfield.helper.CaretStringIterator
import expo.modules.ui.textfield.helper.Compiler
import expo.modules.ui.textfield.model.State
import expo.modules.ui.textfield.model.state.*
import java.util.*

/**
 * ### Mask
 *
 * Iterates over user input. Creates formatted strings from it. Extracts value specified by mask
 * format.
 *
 * Provided mask format string is translated by the ``Compiler`` class into a set of states, which
 * define the formatting and value extraction.
 *
 * @see ``Compiler``, ``State`` and ``CaretString`` classes.
 *
 * @author taflanidi
 */
open class Mask(format: String, protected val customNotations: List<Notation>) {

    /**
     * Convenience constructor.
     */
    constructor(format: String) : this(format, emptyList())

    /**
     * ### Result
     *
     * The end result of mask application to the user input string.
     */
    data class Result(
        /**
         * Formatted text with updated caret position.
         */
        val formattedText: CaretString,
        /**
         * Value, extracted from formatted text according to mask format.
         */
        val extractedValue: String,
        /**
         * Calculated absolute affinity value between the mask format and input text.
         */
        val affinity: Int,
        /**
         * User input is complete.
         */
        val complete: Boolean,
        /**
        Placeholder for remaining text.
         */
        val tailPlaceholder: String
    ) {
        fun reversed() =
            Result(
                this.formattedText.reversed(),
                this.extractedValue.reversed(),
                this.affinity,
                this.complete,
                this.tailPlaceholder.reversed()
            )
    }

    companion object Factory {
        private val cache: MutableMap<String, Mask> = HashMap()

        /**
         * Factory constructor.
         *
         * Operates over own ``Mask`` cache where initialized ``Mask`` objects are stored under
         * corresponding format key:
         * `[format : mask]`
         *
         * @returns Previously cached ``Mask`` object for requested format string. If such it
         * doesn't exist in cache, the object is constructed, cached and returned.
         */
        fun getOrCreate(format: String, customNotations: List<Notation>): Mask {
            var cachedMask: Mask? = cache[format]
            if (null == cachedMask) {
                cachedMask = Mask(format, customNotations)
                cache[format] = cachedMask
            }
            return cachedMask
        }

        /**
         * Check your mask format is valid.
         *
         * @param format mask format.
         * @param customNotations a list of custom rules to compile square bracket `[]` groups of format symbols.
         *
         * @returns `true` if this format coupled with custom notations will compile into a working ``Mask`` object.
         * Otherwise `false`.
         */
        fun isValid(format: String, customNotations: List<Notation>): Boolean {
            return try {
                Mask(format, customNotations)
                true
            } catch (e: Compiler.FormatError) {
                false
            }
        }
    }

    private val initialState: State = Compiler(this.customNotations).compile(format)

    /**
     * Apply mask to the user input string.
     *
     * @param text user input string with current cursor position
     *
     * @returns Formatted text with extracted value an adjusted cursor position.
     */
    open fun apply(text: CaretString): Result {
        val iterator = this.makeIterator(text)

        var affinity = 0
        var extractedValue = ""
        var modifiedString = ""
        var modifiedCaretPosition: Int = text.caretPosition

        var state: State = this.initialState
        val autocompletionStack = AutocompletionStack()

        var insertionAffectsCaret: Boolean = iterator.insertionAffectsCaret()
        var deletionAffectsCaret: Boolean = iterator.deletionAffectsCaret()
        var character: Char? = iterator.next()

        while (null != character) {
            val next: Next? = state.accept(character)
            if (null != next) {
                if (deletionAffectsCaret) autocompletionStack.push(state.autocomplete())
                state = next.state
                modifiedString += next.insert ?: ""
                extractedValue += next.value ?: ""
                if (next.pass) {
                    insertionAffectsCaret = iterator.insertionAffectsCaret()
                    deletionAffectsCaret = iterator.deletionAffectsCaret()
                    character = iterator.next()
                    affinity += 1
                } else {
                    if (insertionAffectsCaret && null != next.insert) {
                        modifiedCaretPosition += 1
                    }
                    affinity -= 1
                }
            } else {
                if (deletionAffectsCaret) {
                    modifiedCaretPosition -= 1
                }
                insertionAffectsCaret = iterator.insertionAffectsCaret()
                deletionAffectsCaret = iterator.deletionAffectsCaret()
                character = iterator.next()
                affinity -= 1
            }
        }

        while (text.caretGravity.autocomplete && insertionAffectsCaret) {
            val next: Next = state.autocomplete() ?: break
            state = next.state
            modifiedString += next.insert ?: ""
            extractedValue += next.value ?: ""
            if (null != next.insert) {
                modifiedCaretPosition += 1
            }
        }

        var tailState = state
        var tail = ""

        while (text.caretGravity.autoskip && !autocompletionStack.empty()) {
            val skip: Next = autocompletionStack.pop()
            if (modifiedString.length == modifiedCaretPosition) {
                if (null != skip.insert && skip.insert == modifiedString.last()) {
                    modifiedString = modifiedString.dropLast(1)
                    modifiedCaretPosition -= 1
                }
                if (null != skip.value && skip.value == extractedValue.last()) {
                    extractedValue = extractedValue.dropLast(1)
                }
            } else {
                if (null != skip.insert) {
                    modifiedCaretPosition -= 1
                }
            }
            tailState = skip.state
            tail = if (skip.insert != null) skip.insert.toString() else tail
        }

        val tailPlaceholder = appendPlaceholder(tailState, tail)

        return Result(
            CaretString(
                modifiedString,
                modifiedCaretPosition,
                text.caretGravity
            ),
            extractedValue,
            affinity,
            this.noMandatoryCharactersLeftAfterState(state),
            tailPlaceholder
        )
    }

    open fun makeIterator(text: CaretString) = CaretStringIterator(text)

    /**
     * Generate placeholder.
     *
     * @return Placeholder string.
     */
    fun placeholder(): String = this.appendPlaceholder(this.initialState, "")

    /**
     * Minimal length of the text inside the field to fill all mandatory characters in the mask.
     *
     * @return Minimal satisfying count of characters inside the text field.
     */
    fun acceptableTextLength(): Int {
        var state: State? = this.initialState
        var length = 0

        while (null != state && state !is EOLState) {
            if (state is FixedState || state is FreeState || state is ValueState) {
                length += 1
            }
            state = state.child
        }

        return length
    }

    /**
     *  Maximal length of the text inside the field.
     *
     *  @return Total available count of mandatory and optional characters inside the text field.
     */
    fun totalTextLength(): Int {
        var state: State? = this.initialState
        var length = 0

        while (null != state && state !is EOLState) {
            if (state is FixedState || state is FreeState || state is ValueState || state is OptionalValueState) {
                length += 1
            }
            state = state.child
        }

        return length
    }

    /**
     * Minimal length of the extracted value with all mandatory characters filled.\
     *
     * @return Minimal satisfying count of characters in extracted value.
     */
    fun acceptableValueLength(): Int {
        var state: State? = this.initialState
        var length = 0

        while (null != state && state !is EOLState) {
            if (state is FixedState || state is ValueState) {
                length += 1
            }
            state = state.child
        }

        return length
    }

    /**
     * Maximal length of the extracted value.
     *
     * @return Total available count of mandatory and optional characters for extracted value.
     */
    fun totalValueLength(): Int {
        var state: State? = this.initialState
        var length = 0

        while (null != state && state !is EOLState) {
            if (state is FixedState || state is ValueState || state is OptionalValueState) {
                length += 1
            }
            state = state.child
        }

        return length
    }

    private fun appendPlaceholder(state: State?, placeholder: String): String {
        if (null == state) {
            return placeholder
        }

        if (state is EOLState) {
            return placeholder
        }

        if (state is FixedState) {
            return this.appendPlaceholder(state.child, placeholder + state.ownCharacter)
        }

        if (state is FreeState) {
            return this.appendPlaceholder(state.child, placeholder + state.ownCharacter)
        }

        if (state is OptionalValueState) {
            return when (state.type) {
                is OptionalValueState.StateType.AlphaNumeric -> {
                    this.appendPlaceholder(state.child, placeholder + "-")
                }

                is OptionalValueState.StateType.Literal -> {
                    this.appendPlaceholder(state.child, placeholder + "a")
                }

                is OptionalValueState.StateType.Numeric -> {
                    this.appendPlaceholder(state.child, placeholder + "0")
                }

                is OptionalValueState.StateType.Custom -> {
                    this.appendPlaceholder(state.child, placeholder + state.type.character)
                }
            }
        }

        if (state is ValueState) {
            return when (state.type) {
                is ValueState.StateType.AlphaNumeric -> {
                    this.appendPlaceholder(state.child, placeholder + "-")
                }

                is ValueState.StateType.Literal -> {
                    this.appendPlaceholder(state.child, placeholder + "a")
                }

                is ValueState.StateType.Numeric -> {
                    this.appendPlaceholder(state.child, placeholder + "0")
                }

                is ValueState.StateType.Ellipsis -> placeholder

                is ValueState.StateType.Custom -> {
                    this.appendPlaceholder(state.child, placeholder + state.type.character)
                }
            }
        }

        return placeholder
    }

    private fun noMandatoryCharactersLeftAfterState(state: State): Boolean {
        return when (state) {
            is EOLState -> { true }
            is ValueState -> { return state.isElliptical }
            is FixedState -> { false }
            else -> { this.noMandatoryCharactersLeftAfterState(state.nextState()) }
        }
    }

    /**
     * While scanning through the input string in the `.apply(…)` method, the mask builds a graph of
     * autocompletion steps.
     *
     * This graph accumulates the results of `.autocomplete()` calls for each consecutive ``State``,
     * acting as a `stack` of ``Next`` object instances.
     *
     * Each time the ``State`` returns `null` for its `.autocomplete()`, the graph resets empty.
     */
    private class AutocompletionStack : Stack<Next>() {
        override fun push(item: Next?): Next? {
            return if (null != item) {
                super.push(item)
            } else {
                this.removeAllElements()
                null
            }
        }
    }
}
