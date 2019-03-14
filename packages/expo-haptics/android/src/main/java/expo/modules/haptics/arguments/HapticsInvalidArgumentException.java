package expo.modules.haptics.arguments;

import org.unimodules.core.errors.CodedException;

public class HapticsInvalidArgumentException extends CodedException {
  HapticsInvalidArgumentException(String message) {
    super(message);
  }

  @Override
  public String getCode() {
    return "E_HAPTICS_INVALID_ARGUMENT";
  }
}
