package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.model.CaretString

/**
 * ### AffinityCalculationStrategy
 *
 * Allows to opt for a different mask picking algorithm in text field listeners.
 */
enum class AffinityCalculationStrategy {
    /**
     * Default strategy.
     *
     * Uses ``Mask`` built-in mechanism to calculate total affinity between the text and the mask format.
     *
     * For example:
     * ```
     * format: [00].[00]
     *
     * input1: 1234
     * input2: 12.34
     * input3: 1.234
     *
     * affinity1 = 4 (symbols) - 1 (missed dot)                       = 3
     * affinity2 = 5 (symbols)                                        = 5
     * affinity3 = 5 (symbols) - 1 (superfluous dot) - 1 (missed dot) = 3
     * ```
     */
    WHOLE_STRING,

    /**
     * Finds the longest common prefix between the original text and the same text after applying the mask.
     *
     * For example:
     * ```
     * format1: +7 [000] [000]
     * format2: 8 [000] [000]
     *
     * input: +7 12 345
     * affinity1 = 5
     * affinity2 = 0
     *
     * input: 8 12 345
     * affinity1 = 0
     * affinity2 = 4
     * ```
     */
    PREFIX,

    /**
     * Affinity is tolerance between the length of the input and the total amount of text current mask can accommodate.
     *
     * If current mask can't accommodate all the text, the affinity equals `Int.min`.
     *
     * For example:
     * ```
     * format1: [00]-[0]
     * format2: [00]-[000]
     * format3: [00]-[00000]
     *
     * input          affinity1          affinity2    affinity3
     * 1              -3                 -5           -7
     * 12             -2                 -4           -6
     * 123            -1                 -3           -5
     * 12-3           0                  -2           -4
     * 1234           0                  -2           -4
     * 12345          Int.MIN_VALUE      -1           -3
     * 123456         Int.MIN_VALUE      0            -2
     * ```
     *
     * This affinity calculation strategy comes in handy when the mask format radically changes depending on the input
     * length.
     *
     * N.B.: Make sure the widest mask format is the primary mask format.
     */
    CAPACITY,

    /**
     * Affinity is tolerance between the length of the extracted value and the total extracted value length current mask can accommodate.
     *
     * If current mask can't accommodate all the text, the affinity equals `Int.min`.
     *
     * For example:
     * ```
     * format1: [00]-[0]
     * format2: [00]-[000]
     * format3: [00]-[00000]
     *
     * input          affinity1          affinity2          affinity3
     * 1              -2                 -4                 -6
     * 12             -1                 -3                 -5
     * 123            0                  -2                 -4
     * 12-3           0                  -2                 -4
     * 1234           Int.MIN_VALUE      -1                 -3
     * 12345          Int.MIN_VALUE      0                  -2
     * 123456         Int.MIN_VALUE      Int.MIN_VALUE      -1
     * ```
     *
     * This affinity calculation strategy comes in handy when the mask format radically changes depending on the value
     * length.
     *
     * N.B.: Make sure the widest mask format is the primary mask format.
     */
    EXTRACTED_VALUE_CAPACITY;

    fun calculateAffinityOfMask(mask: Mask, text: CaretString): Int {
        return when (this) {
            WHOLE_STRING -> mask.apply(text).affinity

            PREFIX -> mask.apply(
                text
            ).formattedText.string.prefixIntersection(text.string).length

            CAPACITY -> if (text.string.length > mask.totalTextLength()) {
                Int.MIN_VALUE
            } else {
                text.string.length - mask.totalTextLength()
            }

            EXTRACTED_VALUE_CAPACITY -> {
                val extractedValueLength: Int = mask.apply(text).extractedValue.length
                if (extractedValueLength > mask.totalValueLength()) {
                    Int.MIN_VALUE
                } else {
                    extractedValueLength - mask.totalValueLength()
                }
            }
        }
    }

    private fun String.prefixIntersection(another: String): String {
        if (this.isEmpty() || another.isEmpty()) return ""

        var endIndex = 0
        while (endIndex < this.length && endIndex < another.length) {
            if (this[endIndex] == another[endIndex]) {
                endIndex += 1
            } else {
                return this.substring(0, endIndex)
            }
        }

        return this.substring(0, endIndex)
    }
}