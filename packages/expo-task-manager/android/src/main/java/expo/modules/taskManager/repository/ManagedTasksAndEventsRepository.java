package expo.modules.taskManager.repository;

import android.content.SharedPreferences;
import android.os.Bundle;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import androidx.annotation.NonNull;

import expo.modules.interfaces.taskManager.TaskInterface;

/**
 * Standard implementation of {@link TasksAndEventsRepository} to be used in managed workflow.
 *
 * It maps <code>appScopeKey</code> to its tasks and events, and allows to retrieve them accordingly.
 */
public class ManagedTasksAndEventsRepository implements TasksAndEventsRepository {

  private final TasksPersistence tasksPersistence;

  public ManagedTasksAndEventsRepository(TasksPersistence tasksPersistence) {
    this.tasksPersistence = tasksPersistence;
  }

  private static Map<String, List<Bundle>> sEvents = new HashMap<>();
  private static Map<String, Map<String, TaskInterface>> sTasks;

  @Override
  public void putEvents(String appScopeKey, List<Bundle> events) {
    sEvents.put(appScopeKey, events);
  }

  @Override
  public void putEventForAppScopeKey(String appScopeKey, Bundle body) {
    sEvents.get(appScopeKey).add(body);
  }

  @Override
  public boolean hasEvents(String appScopeKey) {
    return sEvents.containsKey(appScopeKey);
  }

  @Override
  public void removeEvents(String appScopeKey) {
    sEvents.remove(appScopeKey);
  }

  @Override
  public List<Bundle> getEvents(String appScopeKey) {
    return sEvents.get(appScopeKey);
  }

  @Override
  public boolean tasksExist() {
    return sTasks != null;
  }

  @Override
  public void createTasks() {
    sTasks = new HashMap<>();
  }

  @NonNull
  @Override
  public Set<String> allAppScopeKeysWithTasks() {
    return sTasks.keySet();
  }

  @Override
  public Map<String, TaskInterface> getTasks(String appScopeKey) {
    return sTasks.get(appScopeKey);
  }

  @Override
  public boolean hasTasks(String appScopeKey) {
    return sTasks.containsKey(appScopeKey);
  }

  @Override
  public void putTasks(String appScopeKey, Map<String, TaskInterface> tasks) {
    sTasks.put(appScopeKey, tasks);
  }

  @Override
  public void removeTasks(String appScopeKey) {
    sTasks.remove(appScopeKey);
  }

  @Override
  public void removeTask(String appScopeKey, String taskName) {
    if (sTasks.containsKey(appScopeKey)) {
      Objects.requireNonNull(sTasks.get(appScopeKey)).remove(taskName);
    }
  }

  @Override
  public void persistTasksForAppScopeKey(SharedPreferences preferences, String appScopeKey) {
    tasksPersistence.persistTasksForAppScopeKey(preferences, appScopeKey, getTasks(appScopeKey));
  }

  @Override
  public Map<String, AppConfig> readPersistedTasks(SharedPreferences preferences) {
    return tasksPersistence.readPersistedTasks(preferences);
  }
}
