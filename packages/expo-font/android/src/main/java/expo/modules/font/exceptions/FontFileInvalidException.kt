package expo.modules.font.exceptions

import org.unimodules.core.errors.CodedRuntimeException

class FontFileInvalidException(path: String?) : CodedRuntimeException(String.format("File '%s' isn't a valid font file.", path)) {
  override fun getCode(): String {
    return "ERR_FONT_FILE_INVALID"
  }
}