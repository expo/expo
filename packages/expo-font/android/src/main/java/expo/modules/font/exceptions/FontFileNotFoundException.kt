package expo.modules.font.exceptions

import org.unimodules.core.errors.CodedRuntimeException

class FontFileNotFoundException(fontFamilyName: String?, path: String?) : CodedRuntimeException(String.format("File '%s' for font '%s' doesn't exist.", path, fontFamilyName)) {
  override fun getCode(): String {
    return "ERR_FONT_FILE_NOT_FOUND"
  }
}