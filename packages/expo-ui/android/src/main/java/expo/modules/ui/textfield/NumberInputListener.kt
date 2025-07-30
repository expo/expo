package expo.modules.ui.textfield

import android.icu.number.LocalizedNumberFormatter
import android.icu.number.NumberFormatter
import android.icu.number.Precision
import android.os.Build
import android.text.TextWatcher
import android.widget.EditText
import androidx.annotation.RequiresApi
import expo.modules.ui.textfield.helper.AffinityCalculationStrategy
import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Notation
import java.math.RoundingMode
import java.util.*

/**
 * — Mom, can we have a neural network?
 * — No, we have a neural network at home.
 *
 * Neural network at home:
 */

/**
 * ### NumberInputListener
 *
 * A ``MaskedTextInputListener`` subclass for numbers.
 *
 * Use with caution, this module is still in development.
 *
 * - seealso: the ``NumberInputListener/formatter`` field
 */
@RequiresApi(Build.VERSION_CODES.R)
open class NumberInputListener(
    primaryFormat: String,
    affineFormats: List<String> = emptyList(),
    customNotations: List<Notation> = emptyList(),
    affinityCalculationStrategy: AffinityCalculationStrategy = AffinityCalculationStrategy.WHOLE_STRING,
    autocomplete: Boolean = true,
    autoskip: Boolean = false,
    field: EditText,
    listener: TextWatcher? = null,
    valueListener: ValueListener? = null,
    rightToLeft: Boolean = false
): MaskedTextChangedListener(
    primaryFormat,
    affineFormats,
    customNotations,
    affinityCalculationStrategy,
    autocomplete,
    autoskip,
    field,
    listener,
    valueListener,
    rightToLeft
) {
    /**
     * Convenience constructor.
     */
    constructor(field: EditText):
        this(field, null)

    /**
     * Convenience constructor.
     */
    constructor(field: EditText, valueListener: ValueListener?):
        this(field, null, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(field: EditText, listener: TextWatcher?, valueListener: ValueListener?):
        this(true, false, field, listener, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(
        autocomplete: Boolean,
        autoskip: Boolean,
        field: EditText,
        listener: TextWatcher?,
        valueListener: ValueListener?
    ):
        this(
            "",
            emptyList(),
            emptyList(),
            AffinityCalculationStrategy.WHOLE_STRING,
            autocomplete,
            autoskip,
            field,
            listener,
            valueListener
        )

    open var formatter: LocalizedNumberFormatter =
        NumberFormatter
            .withLocale(Locale("en_us"))
            .roundingMode(RoundingMode.FLOOR)
            .precision(Precision.unlimited())

    override fun placeholder(): String {
        val text = "0"
        val mask = pickMask(
            CaretString(text, text.length, CaretString.CaretGravity.FORWARD(autocomplete))
        )
        return mask.placeholder()
    }

    override fun pickMask(text: CaretString): Mask {
        val sanitisedNumberString = extractNumberAndDecimalSeparator(
//            formatter,
            text.string
        )

        val intNum = sanitisedNumberString.intPart.toLong()
        val intMaskFormat = formatter.format(intNum)

        val intZero = intNum == 0.toLong()
        val notationChar = assignNonZeroNumberNotation()

        var maskFormat = ""
        var first = true
        intMaskFormat.toString().forEach { c: Char ->
            if (c.isDigit()) {
                if (first && !intZero) {
                    maskFormat += "[$notationChar]"
                    first = false
                } else {
                    maskFormat += "[0]"
                }
            } else {
                maskFormat += "{$c}"
            }
        }

        if (sanitisedNumberString.numberOfOccurrencesOfDecimalSeparator > 0) {
            maskFormat += "{${sanitisedNumberString.expectedDecimalSeparator}}"
        }

        sanitisedNumberString.decPart.forEach {
            maskFormat += "[0]"
        }

        primaryFormat = maskFormat
        return super.pickMask(text)
    }

    private data class SanitisedNumberString(
        val intPart: String,
        val decPart: String,
        val expectedDecimalSeparator: String,
        val numberOfOccurrencesOfDecimalSeparator: Int
    )

    private fun extractNumberAndDecimalSeparator(
//        formatter: LocalizedNumberFormatter,
        text: String
    ): SanitisedNumberString {
        val expectedDecimalSeparator: String = decimalSeparator

        var digitsAndDecimalSeparators = text.filter { c: Char -> c.isDigit() || c.toString() == decimalSeparator }

        val numberOfOccurencesOfDecimalSeparator = digitsAndDecimalSeparators.count { c: Char -> c.toString() == decimalSeparator }
        if (numberOfOccurencesOfDecimalSeparator > 1) {
            var numberOfReplacements = numberOfOccurencesOfDecimalSeparator - 1
            digitsAndDecimalSeparators = digitsAndDecimalSeparators.reversed().filter { c: Char ->
                if (!c.isDigit() && numberOfReplacements > 0) {
                    numberOfReplacements -= 1
                    return@filter false
                }
                true
            }.reversed()
        }

        val components = digitsAndDecimalSeparators.split(decimalSeparator)

        var intStr: String
        var decStr = ""

        if (components.size > 1) {
            intStr = components.first()
            decStr = components.last()
        } else {
            intStr = components.first()
        }

        intStr = if (intStr.isEmpty()) "0" else intStr
//        intStr = String(intStr.prefix(formatter.maximumIntegerDigits)) TODO
//        decStr = String(decStr.prefix(formatter.maximumFractionDigits)) TODO

        return SanitisedNumberString(
            intStr,
            decStr,
            expectedDecimalSeparator,
            numberOfOccurencesOfDecimalSeparator
        )
    }

    private fun assignNonZeroNumberNotation(): Char {
        val character = '1'
        customNotations = listOf(
            Notation(
                character,
                "123456789",
                false
            )
        )
        return character
    }

    companion object {
        val decimalSeparator = "."

        /**
         * Create a ``NumberInputListener`` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            valueListener: ValueListener? = null
        ): NumberInputListener = installOn(
            editText,
            true,
            false,
            null,
            valueListener
        )

        /**
         * Create a ``NumberInputListener`` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            autocomplete: Boolean = true,
            autoskip: Boolean = false,
            listener: TextWatcher? = null,
            valueListener: ValueListener? = null
        ): NumberInputListener {
            val maskedListener = NumberInputListener(
                autocomplete,
                autoskip,
                editText,
                listener,
                valueListener
            )
            editText.addTextChangedListener(maskedListener)
            editText.onFocusChangeListener = maskedListener
            return maskedListener
        }
    }
}