package expo.modules.ui.textfield

import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.widget.EditText
import cexpo.modules.ui.textfield.helper.AffinityCalculationStrategy
import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.helper.RTLMask
import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Notation
import java.lang.ref.WeakReference
import java.util.*

/**
 * TextWatcher implementation.
 *
 * TextWatcher implementation, which applies masking to the user input, picking the most suitable mask for the text.
 *
 * Might be used as a decorator, which forwards TextWatcher calls to its own listener.
 */
open class MaskedTextChangedListener(
    var primaryFormat: String,
    var affineFormats: List<String> = emptyList(),
    var customNotations: List<Notation> = emptyList(),
    var affinityCalculationStrategy: AffinityCalculationStrategy = AffinityCalculationStrategy.WHOLE_STRING,
    var autocomplete: Boolean = true,
    var autoskip: Boolean = false,
    field: EditText,
    var listener: TextWatcher? = null,
    var valueListener: ValueListener? = null,
    var rightToLeft: Boolean = false
) : TextWatcher, View.OnFocusChangeListener {

    interface ValueListener {
        fun onTextChanged(
            maskFilled: Boolean,
            extractedValue: String,
            formattedValue: String,
            tailPlaceholder: String
        )
    }

    private val primaryMask: Mask
        get() = this.maskGetOrCreate(this.primaryFormat, this.customNotations)

    private var afterText: String = ""
    private var caretPosition: Int = 0

    private val field: WeakReference<EditText> = WeakReference(field)

    /**
     * Convenience constructor.
     */
    constructor(format: String, field: EditText) :
            this(format, field, null)

    /**
     * Convenience constructor.
     */
    constructor(format: String, field: EditText, valueListener: ValueListener?) :
            this(format, field, null, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(format: String, field: EditText, listener: TextWatcher?, valueListener: ValueListener?) :
            this(format, true, field, listener, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(
        format: String, autocomplete: Boolean, field: EditText, listener: TextWatcher?,
        valueListener: ValueListener?
    ) :
            this(
                format, emptyList(), emptyList(), AffinityCalculationStrategy.WHOLE_STRING,
                autocomplete, false, field, listener, valueListener
            )

    /**
     * Convenience constructor.
     */
    constructor(primaryFormat: String, affineFormats: List<String>, field: EditText) :
            this(primaryFormat, affineFormats, field, null)

    /**
     * Convenience constructor.
     */
    constructor(primaryFormat: String, affineFormats: List<String>, field: EditText, valueListener: ValueListener?) :
            this(primaryFormat, affineFormats, field, null, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(
        primaryFormat: String, affineFormats: List<String>, field: EditText, listener: TextWatcher?,
        valueListener: ValueListener?
    ) :
            this(primaryFormat, affineFormats, true, field, listener, valueListener)

    /**
     * Convenience constructor.
     */
    constructor(
        primaryFormat: String, affineFormats: List<String>, autocomplete: Boolean, field: EditText,
        listener: TextWatcher?, valueListener: ValueListener?
    ) :
            this(
                primaryFormat, affineFormats, AffinityCalculationStrategy.WHOLE_STRING, autocomplete, field, listener,
                valueListener
            )

    /**
     * Convenience constructor.
     */
    constructor(
        primaryFormat: String, affineFormats: List<String>,
        affinityCalculationStrategy: AffinityCalculationStrategy, autocomplete: Boolean, field: EditText,
        listener: TextWatcher?, valueListener: ValueListener?
    ) :
            this(
                primaryFormat, affineFormats, emptyList(), affinityCalculationStrategy,
                autocomplete, false, field, listener, valueListener
            )

    /**
     * Set text and apply formatting.
     * @param text - text; might be plain, might already have some formatting.
     */
    open fun setText(text: String, autocomplete: Boolean? = null): Mask.Result? {
        return this.field.get()?.let {
            val result = setText(text, it, autocomplete)
            this.afterText = result.formattedText.string
            this.caretPosition = result.formattedText.caretPosition
            this.valueListener?.onTextChanged(result.complete, result.extractedValue, afterText, result.tailPlaceholder)
            return result
        }
    }

    /**
     * Set text and apply formatting.
     * @param text - text; might be plain, might already have some formatting;
     * @param field - a field where to put formatted text.
     */
    open fun setText(text: String, field: EditText, autocomplete: Boolean? = null): Mask.Result {
        val useAutocomplete: Boolean = autocomplete ?: this.autocomplete
        val textAndCaret = CaretString(text, text.length, CaretString.CaretGravity.FORWARD(useAutocomplete))
        val result: Mask.Result = this.pickMask(textAndCaret).apply(textAndCaret)

        with(field) {
            setText(result.formattedText.string)

            try {
                setSelection(result.formattedText.caretPosition)
            } catch (e: java.lang.IndexOutOfBoundsException) {
                Log.e(
                    "input-mask-android",
                    """
                    
                    WARNING! Your text field is not configured for the MaskedTextChangedListener! 
                    For more information please refer to 
                    
                    InputMask vs. android:inputType and IndexOutOfBoundsException
                    https://github.com/RedMadRobot/input-mask-android#inputmask-vs-androidinputtype-and-indexoutofboundsexception
                    """
                )
            }
        }

        return result
    }

    /**
     * Generate placeholder.
     *
     * @return Placeholder string.
     */
    open fun placeholder(): String = this.primaryMask.placeholder()

    /**
     * Minimal length of the text inside the field to fill all mandatory characters in the mask.
     *
     * @return Minimal satisfying count of characters inside the text field.
     */
    fun acceptableTextLength(): Int = this.primaryMask.acceptableTextLength()

    /**
     *  Maximal length of the text inside the field.
     *
     *  @return Total available count of mandatory and optional characters inside the text field.
     */
    fun totalTextLength(): Int = this.primaryMask.totalTextLength()

    /**
     * Minimal length of the extracted value with all mandatory characters filled.\
     *
     * @return Minimal satisfying count of characters in extracted value.
     */
    fun acceptableValueLength(): Int = this.primaryMask.acceptableValueLength()

    /**
     * Maximal length of the extracted value.
     *
     * @return Total available count of mandatory and optional characters for extracted value.
     */
    fun totalValueLength(): Int = this.primaryMask.totalValueLength()

    override fun afterTextChanged(edit: Editable?) {
        this.field.get()?.removeTextChangedListener(this)
        edit?.replace(0, edit.length, this.afterText)

        try {
            this.field.get()?.setSelection(this.caretPosition)
        } catch (e: IndexOutOfBoundsException) {
            Log.e(
                "input-mask-android",
                """
                    
                    WARNING! Your text field is not configured for the MaskedTextChangedListener! 
                    For more information please refer to 
                    
                    InputMask vs. android:inputType and IndexOutOfBoundsException
                    https://github.com/RedMadRobot/input-mask-android#inputmask-vs-androidinputtype-and-indexoutofboundsexception
                    """
            )
        }

        this.field.get()?.addTextChangedListener(this)
        this.listener?.afterTextChanged(edit)
    }

    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
        this.listener?.beforeTextChanged(s, start, count, after)
    }

    override fun onTextChanged(text: CharSequence, cursorPosition: Int, before: Int, count: Int) {
        val isDeletion: Boolean = before > 0 && count == 0
        val useAutocomplete = if (isDeletion) false else this.autocomplete
        val useAutoskip = if (isDeletion) this.autoskip else false
        val caretGravity =
            if (isDeletion) CaretString.CaretGravity.BACKWARD(useAutoskip) else CaretString.CaretGravity.FORWARD(useAutocomplete)

        val caretPosition = if (isDeletion) cursorPosition else cursorPosition + count
        val textAndCaret = CaretString(text.toString(), caretPosition, caretGravity)

        val mask: Mask = this.pickMask(textAndCaret)
        val result: Mask.Result = mask.apply(textAndCaret)

        this.afterText = result.formattedText.string
        this.caretPosition = result.formattedText.caretPosition

        this.valueListener?.onTextChanged(result.complete, result.extractedValue, afterText, result.tailPlaceholder)
    }

    override fun onFocusChange(view: View?, hasFocus: Boolean) {
        if (this.autocomplete && hasFocus) {
            val text: String = if (this.field.get()?.text!!.isEmpty()) {
                ""
            } else {
                this.field.get()?.text.toString()
            }

            val textAndCaret = CaretString(text, text.length, CaretString.CaretGravity.FORWARD(this.autocomplete))

            val result: Mask.Result =
                this.pickMask(textAndCaret).apply(textAndCaret)

            this.afterText = result.formattedText.string
            this.caretPosition = result.formattedText.caretPosition
            this.field.get()?.setText(afterText)

            try {
                this.field.get()?.setSelection(result.formattedText.caretPosition)
            } catch (e: IndexOutOfBoundsException) {
                Log.e(
                    "input-mask-android",
                    """
                        
                    WARNING! Your text field is not configured for the MaskedTextChangedListener! 
                    For more information please refer to 
                    
                    InputMask vs. android:inputType and IndexOutOfBoundsException
                    https://github.com/RedMadRobot/input-mask-android#inputmask-vs-androidinputtype-and-indexoutofboundsexception
                    """
                )
            }
            this.valueListener?.onTextChanged(result.complete, result.extractedValue, afterText, result.tailPlaceholder)
        }
    }

    open fun pickMask(
        text: CaretString
    ): Mask {
        if (this.affineFormats.isEmpty()) return this.primaryMask

        data class MaskAffinity(val mask: Mask, val affinity: Int)

        val primaryAffinity: Int = this.calculateAffinity(this.primaryMask, text)

        val masksAndAffinities: MutableList<MaskAffinity> = ArrayList()
        for (format in this.affineFormats) {
            val mask: Mask = this.maskGetOrCreate(format, this.customNotations)
            val affinity: Int = this.calculateAffinity(mask, text)
            masksAndAffinities.add(MaskAffinity(mask, affinity))
        }

        masksAndAffinities.sortByDescending { it.affinity }

        var insertIndex: Int = -1

        for ((index, maskAffinity) in masksAndAffinities.withIndex()) {
            if (primaryAffinity >= maskAffinity.affinity) {
                insertIndex = index
                break
            }
        }

        if (insertIndex >= 0) {
            masksAndAffinities.add(insertIndex, MaskAffinity(this.primaryMask, primaryAffinity))
        } else {
            masksAndAffinities.add(MaskAffinity(this.primaryMask, primaryAffinity))
        }

        return masksAndAffinities.first().mask
    }

    private fun maskGetOrCreate(format: String, customNotations: List<Notation>): Mask =
        if (this.rightToLeft) {
            RTLMask.getOrCreate(format, customNotations)
        } else {
            Mask.getOrCreate(format, customNotations)
        }

    private fun calculateAffinity(
        mask: Mask,
        text: CaretString
    ): Int {
        return this.affinityCalculationStrategy.calculateAffinityOfMask(
            mask,
            text
        )
    }

    companion object {
        /**
         * Create a `MaskedTextChangedListener` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            primaryFormat: String,
            valueListener: ValueListener? = null
        ): MaskedTextChangedListener = installOn(
            editText,
            primaryFormat,
            emptyList(),
            AffinityCalculationStrategy.WHOLE_STRING,
            valueListener
        )

        /**
         * Create a `MaskedTextChangedListener` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            primaryFormat: String,
            affineFormats: List<String> = emptyList(),
            affinityCalculationStrategy: AffinityCalculationStrategy = AffinityCalculationStrategy.WHOLE_STRING,
            valueListener: ValueListener? = null
        ): MaskedTextChangedListener = installOn(
            editText,
            primaryFormat,
            affineFormats,
            emptyList(),
            affinityCalculationStrategy,
            true,
            false,
            null,
            valueListener
        )

        /**
         * Create a `MaskedTextChangedListener` instance and assign it as a field's
         * `TextWatcher` and `onFocusChangeListener`.
         */
        fun installOn(
            editText: EditText,
            primaryFormat: String,
            affineFormats: List<String> = emptyList(),
            customNotations: List<Notation> = emptyList(),
            affinityCalculationStrategy: AffinityCalculationStrategy = AffinityCalculationStrategy.WHOLE_STRING,
            autocomplete: Boolean = true,
            autoskip: Boolean = false,
            listener: TextWatcher? = null,
            valueListener: ValueListener? = null
        ): MaskedTextChangedListener {
            val maskedListener = MaskedTextChangedListener(
                primaryFormat,
                affineFormats,
                customNotations,
                affinityCalculationStrategy,
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
