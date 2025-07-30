package expo.modules.ui.textfield.helper

import expo.modules.ui.textfield.helper.Mask
import expo.modules.ui.textfield.model.CaretString
import expo.modules.ui.textfield.model.Notation
import java.util.HashMap

/**
 * ### RTLMask
 *
 * A right-to-left ``Mask`` subclass. Applies format from the string end.
 */
class RTLMask(format: String, customNotations: List<Notation>) : Mask(reversedFormat(format), customNotations) {
    companion object Factory {
        private val cache: MutableMap<String, RTLMask> = HashMap()

        fun getOrCreate(format: String, customNotations: List<Notation>): RTLMask {
            var cachedMask: RTLMask? = cache[reversedFormat(format)]
            if (null == cachedMask) {
                cachedMask = RTLMask(format, customNotations)
                cache[reversedFormat(format)] = cachedMask
            }
            return cachedMask
        }
    }

    override fun apply(text: CaretString): Result {
        return super.apply(text.reversed()).reversed()
    }

    override fun makeIterator(text: CaretString): CaretStringIterator {
        return RTLCaretStringIterator(text)
    }
}

private fun reversedFormat(format: String) =
    format
        .reversed()
        .replace("[\\", "\\]")
        .replace("]\\", "\\[")
        .replace("{\\", "\\}")
        .replace("}\\", "\\{")
        .map {
            when (it) {
                '[' -> ']'
                ']' -> '['
                '{' -> '}'
                '}' -> '{'
                else -> it
            }
        }.joinToString("")
