package expo.modules.font.exceptions

import org.unimodules.core.errors.CodedRuntimeException

class FontAlreadyLoadedException(fontFamilyName: String?) : CodedRuntimeException(String.format("Font with family name '%s' has already been loaded.", fontFamilyName)) {
  override fun getCode(): String {
    return "ERR_FONT_ALREADY_LOADED"
  }
}