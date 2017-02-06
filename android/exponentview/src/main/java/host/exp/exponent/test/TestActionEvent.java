// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.test;

public class TestActionEvent {

  public final String selectorType;
  public final String selectorValue;
  public final String actionType;
  public final String actionValue;
  public final int delay;

  public TestActionEvent(final String selectorType, final String selectorValue, final String actionType, final String actionValue, final int delay) {
    this.selectorType = selectorType;
    this.selectorValue = selectorValue;
    this.actionType = actionType;
    this.actionValue = actionValue;
    this.delay = delay;
  }
}
