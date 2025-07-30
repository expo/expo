package expo.modules.ui.textfield

import android.text.TextWatcher
import android.widget.EditText
import expo.modules.ui.textfield.helper.AffinityCalculationStrategy
import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Country
import expo.modules.ui.textfield.model.Notation

/**
 * ### PhoneInputListener
 *
 * A ``MaskedTextInputListener`` subclass for guessing a country based on the entered digit sequence
 *
 * Computed country dictates the phone formatting
 */
open class PhoneInputListener(
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

    /**
     * A detected ``Country`` based on the entered digits
     */
    var computedCountry: Country? = null

    /**
     * A list of possible ``Country`` candidates based on the entered digits
     */
    var computedCountries: List<Country> = listOf()

    /**
     * Allowed ``Country`` list. Pre-filters the ``Country::all`` dictionary.
     *
     * May contain country names, native country names, ISO-3166 codes, country emojis, or their mix.
     *
     * E.g.
     * ```
     * listener.enableCountries = listOf(
     *   "Greece",
     *   "BE",
     *   "🇪🇸"
     * )
     * ```
     */
    var enableCountries: List<String>? = null

    /**
     * Blocked ``Country`` list. Pre-filters the ``Country::all`` dictionary.
     *
     * May contain country names, native country names, ISO-3166 codes, country emojis, or their mix.
     *
     * E.g.
     * ```
     * listener.disableCountries = listOf(
     *   "Greece",
     *   "BE",
     *   "🇪🇸"
     * )
     * ```
     */
    var disableCountries: List<String>? = null

    /**
    A custom ``Country`` list to be used instead of ``Country::all`` dictionary.
     */
    var customCountries: List<Country>? = null

    override fun pickMask(text: CaretString): Mask {
        computedCountries = Country.findCountries(customCountries, enableCountries, disableCountries, text.string)
        computedCountry = if (computedCountries.count() == 1) computedCountries.first() else null

        val country = computedCountry
        return if (country == null) {
            Mask("+[000] [000] [000] [00] [00]")
        } else {
            primaryFormat = country.primaryFormat
            affineFormats = country.affineFormats

            super.pickMask(text)
        }
    }

    companion object {
        /**
         * Create a ``PhoneInputListener`` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            valueListener: ValueListener? = null
        ): PhoneInputListener = installOn(
            editText,
            true,
            false,
            null,
            valueListener
        )

        /**
         * Create a ``PhoneInputListener`` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            autocomplete: Boolean = true,
            autoskip: Boolean = false,
            listener: TextWatcher? = null,
            valueListener: ValueListener? = null
        ): PhoneInputListener {
            val maskedListener = PhoneInputListener(
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
