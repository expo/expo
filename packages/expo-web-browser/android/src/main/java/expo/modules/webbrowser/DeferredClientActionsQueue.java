package expo.modules.webbrowser;

import expo.modules.core.interfaces.Consumer;

import java.util.LinkedList;
import java.util.Queue;


public class DeferredClientActionsQueue<T> {

  private Queue<Consumer<T>> actions = new LinkedList<>();
  private T client;

  public void executeOrQueueAction(Consumer<T> action) {
    if (client != null) {
      action.apply(client);
    } else {
      addActionToQueue(action);
    }
  }

  public void setClient(T client) {
    this.client = client;
    executeQueuedActions();
  }

  public void clear() {
    this.client = null;
    this.actions.clear();
  }

  public boolean hasClient() {
    return client != null;
  }

  private void executeQueuedActions() {
    if (client != null) {
      Consumer<T> action = actions.poll();
      while (action != null) {
        action.apply(client);
        action = actions.poll();
      }
    }
  }

  private void addActionToQueue(Consumer<T> consumer) {
    actions.add(consumer);
  }

}
