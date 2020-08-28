package expo.modules.font.exceptions;

import org.unimodules.core.errors.CodedRuntimeException;

public class FontFileNotFoundException extends CodedRuntimeException {
  public FontFileNotFoundException(String fontFamilyName, String path) {
    super(String.format("File '%s' for font '%s' doesn't exist.", path, fontFamilyName));
  }

  @Override
  public String getCode() {
    return "ERR_FONT_FILE_NOT_FOUND";
  }
}
