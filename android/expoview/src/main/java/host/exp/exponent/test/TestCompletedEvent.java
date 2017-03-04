// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.test;

public class TestCompletedEvent {

  public final int id;
  public final String result;

  public TestCompletedEvent(final int id, final String result) {
    this.id = id;
    this.result = result;
  }
}
