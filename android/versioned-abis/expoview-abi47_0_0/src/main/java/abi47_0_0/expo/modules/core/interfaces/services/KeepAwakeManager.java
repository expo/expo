package abi47_0_0.expo.modules.core.interfaces.services;

import abi47_0_0.expo.modules.core.errors.CurrentActivityNotFoundException;

public interface KeepAwakeManager {
  void activate(String tag, Runnable done) throws CurrentActivityNotFoundException;

  void deactivate(String tag, Runnable done) throws CurrentActivityNotFoundException;

  boolean isActivated();
}
