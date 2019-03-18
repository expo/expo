package org.unimodules.core.interfaces.services;

import org.unimodules.core.errors.CurrentActivityNotFoundException;

public interface KeepAwakeManager {
  void activate(Runnable done) throws CurrentActivityNotFoundException;

  void deactivate(Runnable done) throws CurrentActivityNotFoundException;

  boolean isActivated();
}
