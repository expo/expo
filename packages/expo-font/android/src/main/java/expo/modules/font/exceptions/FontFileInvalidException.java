package expo.modules.font.exceptions;

import org.unimodules.core.errors.CodedRuntimeException;

public class FontFileInvalidException extends CodedRuntimeException {
  public FontFileInvalidException(String path) {
    super(String.format("File '%s' isn't a valid font file.", path));
  }

  @Override
  public String getCode() {
    return "ERR_FONT_FILE_INVALID";
  }
}
