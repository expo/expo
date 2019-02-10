package expo.modules.bluetooth;

import java.util.LinkedList;

import expo.core.Promise;
import expo.modules.bluetooth.actions.Action;


import java.util.ArrayList;

public class EXBTQueue {
  final ArrayList<Action> operations;

  public EXBTQueue() {
    operations = new ArrayList<>();
  }

  public void addAction(Action operation) {
    operations.add(operation);
    operation.setOwnerQueue(this);
  }

  public ArrayList<Action> getActions() {
    return operations;
  }
}
