package expo.modules.font.exceptions;

import org.unimodules.core.errors.CodedRuntimeException;

public class FontAlreadyLoadedException extends CodedRuntimeException {
  public FontAlreadyLoadedException(String fontFamilyName) {
    super(String.format("Font with family name '%s' has already been loaded.", fontFamilyName));
  }

  @Override
  public String getCode() {
    return "ERR_FONT_ALREADY_LOADED";
  }
}
