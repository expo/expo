package abi42_0_0.org.unimodules.core.interfaces.services;

import abi42_0_0.org.unimodules.core.errors.CurrentActivityNotFoundException;

public interface KeepAwakeManager {
  void activate(String tag, Runnable done) throws CurrentActivityNotFoundException;

  void deactivate(String tag, Runnable done) throws CurrentActivityNotFoundException;

  boolean isActivated();
}
