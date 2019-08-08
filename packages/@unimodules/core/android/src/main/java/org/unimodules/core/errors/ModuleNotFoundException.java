package org.unimodules.core.errors;

import org.unimodules.core.interfaces.CodedThrowable;

public class ModuleNotFoundException extends CodedException implements CodedThrowable {
  public ModuleNotFoundException(String moduleName) {
    super("Module '" + moduleName + "' not found. Are you sure all modules are linked correctly?");
  }

  @Override
  public String getCode() {
    return "E_MODULE_NOT_FOUND";
  }
}
