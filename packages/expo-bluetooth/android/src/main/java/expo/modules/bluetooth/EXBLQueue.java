package expo.modules.bluetooth;

import java.util.LinkedList;

import expo.core.Promise;

public class EXBLQueue {

  public static QueueDelegate delegate;

  public interface QueueDelegate {
    boolean runAction(Action action);
  }

  public class Action {
    protected Promise promise;
    protected String type;

    Action(String type, Promise promise) {
      this.type = type;
      this.promise = promise;
    }

    public void resolve(Object value) {
      if (promise == null) {
        return;
      }
      promise.resolve(value);
      promise = null;
      remove();
    }

    public void reject(BluetoothError error) {
      if (promise == null) {
        return;
      }
      promise.reject(error.code, error.message);
      promise = null;
      remove();
    }
  }

  private LinkedList<Action> queue = new LinkedList<>();

  public void enqueue(Action action) {
    queue.add(action);
    start();
  }

  // Only run one operation at a time.
  public void start() {
    if (queue.size() > 1) {
      return;
    }
    next();
  }

  private void next() {
    Action operation = queue.peek();
    delegate.runAction(operation);
//    if (!delegate.runAction(operation)) {
//      remove();
//    }
  }

  private void remove() {
    if (queue.size() == 0) {
      return;
    }
    queue.poll();

    if (queue.size() == 0) {
      return;
    }
    next();
  }


}
