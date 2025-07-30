package expo.modules.ui.textfield

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Notation
import expo.modules.ui.textfield.helper.AffinityCalculationStrategy
import expo.modules.ui.textfield.helper.RTLMask

class MaskedVisualTransformation(
    private val primaryFormat: String,
    private val affineFormats: List<String> = emptyList(),
    private val customNotations: List<Notation> = emptyList(),
    private val affinityCalculationStrategy: AffinityCalculationStrategy = AffinityCalculationStrategy.WHOLE_STRING,
    private val autocomplete: Boolean = true,
    private val autoskip: Boolean = false,
    private val rightToLeft: Boolean = false
) : VisualTransformation {

    private val primaryMask: Mask
        get() = maskGetOrCreate(primaryFormat, customNotations)

    override fun filter(text: AnnotatedString): TransformedText {
        val caretString = if (text.text.isEmpty()) {
            CaretString("", 0, CaretString.CaretGravity.FORWARD(autocomplete))
        } else {
            CaretString(text.text, text.length, CaretString.CaretGravity.FORWARD(autocomplete))
        }
        val mask = pickMask(caretString)
        val result = mask.apply(caretString)

        val originalTextLength = text.text.length
        val transformedTextLength = result.formattedText.string.length

        val offsetMapping = object : OffsetMapping {
            override fun originalToTransformed(offset: Int): Int {
                return offset.coerceIn(0, transformedTextLength)
            }

            override fun transformedToOriginal(offset: Int): Int {
                return offset.coerceIn(0, originalTextLength)
            }
        }

        return TransformedText(
            AnnotatedString(result.formattedText.string),
            offsetMapping
        )
    }

    private fun pickMask(text: CaretString): Mask {
        if (affineFormats.isEmpty()) return primaryMask

        data class MaskAffinity(val mask: Mask, val affinity: Int)

        val primaryAffinity: Int = calculateAffinity(primaryMask, text)

        val masksAndAffinities: MutableList<MaskAffinity> = ArrayList()
        for (format in affineFormats) {
            val mask: Mask = maskGetOrCreate(format, customNotations)
            val affinity: Int = calculateAffinity(mask, text)
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
            masksAndAffinities.add(insertIndex, MaskAffinity(primaryMask, primaryAffinity))
        } else {
            masksAndAffinities.add(MaskAffinity(primaryMask, primaryAffinity))
        }

        return masksAndAffinities.first().mask
    }

    private fun maskGetOrCreate(format: String, customNotations: List<Notation>): Mask =
        if (rightToLeft) {
            RTLMask.getOrCreate(format, customNotations)
        } else {
            Mask.getOrCreate(format, customNotations)
        }

    private fun calculateAffinity(mask: Mask, text: CaretString): Int {
        return affinityCalculationStrategy.calculateAffinityOfMask(mask, text)
    }
}