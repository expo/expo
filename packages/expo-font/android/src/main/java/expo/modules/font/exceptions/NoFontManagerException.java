package expo.modules.font.exceptions;

import org.unimodules.core.errors.CodedException;

public class NoFontManagerException extends CodedException {
  public NoFontManagerException() {
    super("There is no FontManager in module registry. Are you sure all the dependencies of expo-font are installed and linked?");
  }

  @Override
  public String getCode() {
    return "ERR_NO_REQUIRED_DEPENDENCY";
  }
}
