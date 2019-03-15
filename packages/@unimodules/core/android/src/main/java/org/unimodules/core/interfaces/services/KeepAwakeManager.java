package org.unimodules.core.interfaces.services;

import org.unimodules.core.Promise;

public interface KeepAwakeManager {
  void activate(Promise promise);

  void deactivate(Promise promise);

  boolean isActivated();
}
