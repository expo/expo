package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.model.Notation
import expo.modules.ui.textfield.model.State
import expo.modules.ui.textfield.model.state.*

/**
 * ### Compiler
 *
 * Creates a sequence of states from the mask format string.
 * @see ``State`` class.
 *
 * @complexity `O(formatString.characters.count)` plus ``FormatSanitizer`` complexity.
 *
 * @requires Format string to contain only flat groups of symbols in `[]` and `{}` brackets
 * without nested brackets, like `[[000]99]`. Also, `[…]` groups may contain only the
 * specified characters ("0", "9", "A", "a", "…", "_" and "-"). Square bracket `[]` groups cannot
 * contain mixed types of symbols ("0" and "9" with "A" and "a" or "_" and "-").
 *
 * ``Compiler`` object is initialized and ``Compiler.compile(formatString:)`` is called during
 * the ``Mask`` instance initialization.
 *
 * ``Compiler`` uses ``FormatSanitizer`` to prepare `formatString` for the compilation.
 *
 * @author taflanidi
 */
class Compiler(
    /**
     * A list of custom rules to compile square bracket `[]` groups of format symbols.
     *
     * @see ``Notation`` class.
     */
    private val customNotations: List<Notation>
) {

    /**
     * ### FormatError
     *
     * Compiler error exception type, thrown when `formatString` contains inappropriate
     * character sequences.
     *
     * ``FormatError`` is used by the ``Compiler`` and ``FormatSanitizer`` classes.
     */
    class FormatError : Exception()

    /**
     * Compile `formatString` into the sequence of states.
     *
     * * "Free" characters from `formatString` are converted to ``FreeState``-s.
     * * Characters in square brackets are converted to ``ValueState``-s and ``OptionalValueState``-s.
     * * Characters in curly brackets are converted to ``FixedState``-s.
     * * End of the formatString line makes ``EOLState``.
     *
     * For instance,
     *
     * ```
     * [09]{.}[09]{.}19[00]
     * ```
     *
     * is converted to sequence:
     *
     * ```
     * 0. ValueState.Numeric          [0]
     * 1. OptionalValueState.Numeric  [9]
     * 2. FixedState                  {.}
     * 3. ValueState.Numeric          [0]
     * 4. OptionalValueState.Numeric  [9]
     * 5. FixedState                  {.}
     * 6. FreeState                    1
     * 7. FreeState                    9
     * 8. ValueState.Numeric          [0]
     * 9. ValueState.Numeric          [0]
     * ```
     *
     * @param formatString string with a mask format.
     *
     * @see ``State`` class.
     *
     * @complexity `O(formatString.characters.count)` plus ``FormatSanitizer`` complexity.
     *
     * @requires: Format string to contain only flat groups of symbols in `[]` and `{}` brackets
     * without nested brackets, like `[[000]99]`. Also, `[…]` groups may contain only the
     * specified characters ("0", "9", "A", "a", "…", "_" and "-").
     *
     * @returns Initialized ``State`` object with assigned ``State.child`` chain.
     *
     * @throws ``FormatError`` if `formatString` does not conform to the method requirements.
     */
    @Throws(FormatError::class)
    fun compile(formatString: String): State {
        val sanitizedString: String = FormatSanitizer().sanitize(formatString)

        return this.compile(
            sanitizedString,
            false,
            false,
            null
        )
    }

    private fun compile(formatString: String, valuable: Boolean, fixed: Boolean, lastCharacter: Char?): State {
        if (formatString.isEmpty()) {
            return EOLState()
        }

        val char: Char = formatString.first()

        when (char) {
            '[' -> {
                if ('\\' != lastCharacter) {
                    return this.compile(
                        formatString.drop(1),
                        true,
                        false,
                        char
                    )
                }
            }

            '{' -> {
                if ('\\' != lastCharacter) {
                    return this.compile(
                        formatString.drop(1),
                        false,
                        true,
                        char
                    )
                }
            }

            ']' -> {
                if ('\\' != lastCharacter) {
                    return this.compile(
                        formatString.drop(1),
                        false,
                        false,
                        char
                    )
                }
            }

            '}' -> {
                if ('\\' != lastCharacter) {
                    return this.compile(
                        formatString.drop(1),
                        false,
                        false,
                        char
                    )
                }
            }

            '\\' -> {
                if ('\\' != lastCharacter) {
                    return this.compile(
                        formatString.drop(1),
                        valuable,
                        fixed,
                        char
                    )
                }
            }
        }

        if (valuable) {
            when (char) {
                '0' -> {
                    return ValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        ValueState.StateType.Numeric()
                    )
                }

                'A' -> {
                    return ValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        ValueState.StateType.Literal()
                    )
                }

                '_' -> {
                    return ValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        ValueState.StateType.AlphaNumeric()
                    )
                }

                '…' -> {
                    return ValueState(determineInheritedType(lastCharacter))
                }

                '9' -> {
                    return OptionalValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        OptionalValueState.StateType.Numeric()
                    )
                }

                'a' -> {
                    return OptionalValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        OptionalValueState.StateType.Literal()
                    )
                }

                '-' -> {
                    return OptionalValueState(
                        this.compile(
                            formatString.drop(1),
                            true,
                            false,
                            char
                        ),
                        OptionalValueState.StateType.AlphaNumeric()
                    )
                }

                else -> return compileWithCustomNotations(char, formatString)
            }
        }

        if (fixed) {
            return FixedState(
                this.compile(
                    formatString.drop(1),
                    false,
                    true,
                    char
                ),
                char
            )
        }

        return FreeState(
            this.compile(
                formatString.drop(1),
                false,
                false,
                char
            ),
            char
        )
    }

    private fun determineInheritedType(lastCharacter: Char?): ValueState.StateType {
        return when (lastCharacter) {
            '0', '9' -> ValueState.StateType.Numeric()
            'A', 'a' -> ValueState.StateType.Literal()
            '_', '-' -> ValueState.StateType.AlphaNumeric()
            '…' -> ValueState.StateType.AlphaNumeric()
            '[' -> ValueState.StateType.AlphaNumeric()
            else -> determineTypeWithCustomNotations(lastCharacter)
        }
    }

    private fun compileWithCustomNotations(char: Char, string: String): State {
        for (customNotation in this.customNotations) {
            if (customNotation.character == char) {
                return if (customNotation.isOptional) {
                    OptionalValueState(
                        this.compile(
                            string.drop(1),
                            true,
                            false,
                            char
                        ),
                        OptionalValueState.StateType.Custom(char, customNotation.characterSet)
                    )
                } else {
                    ValueState(
                        this.compile(
                            string.drop(1),
                            true,
                            false,
                            char
                        ),
                        ValueState.StateType.Custom(char, customNotation.characterSet)
                    )
                }
            }
        }
        throw FormatError()
    }

    private fun determineTypeWithCustomNotations(lastCharacter: Char?): ValueState.StateType {
        customNotations.forEach { notation: Notation ->
            if (notation.character == lastCharacter) return ValueState.StateType.Custom(
                lastCharacter,
                notation.characterSet
            )
        }
        throw FormatError()
    }

}
