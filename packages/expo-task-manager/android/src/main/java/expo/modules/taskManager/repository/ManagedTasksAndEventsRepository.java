package expo.modules.taskManager.repository;

import android.content.SharedPreferences;
import android.os.Bundle;

import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import androidx.annotation.NonNull;

/**
 * Standard implementation of {@link TasksAndEventsRepository} to be used in managed workflow.
 *
 * It maps <code>appId</code> to its tasks and events, and allows to retrieve them accordingly.
 */
public class ManagedTasksAndEventsRepository implements TasksAndEventsRepository {

  private final TasksPersistence tasksPersistence;

  public ManagedTasksAndEventsRepository(TasksPersistence tasksPersistence) {
    this.tasksPersistence = tasksPersistence;
  }

  private static Map<String, List<Bundle>> sEvents = new HashMap<>();
  private static Map<String, Map<String, TaskInterface>> sTasks;

  @Override
  public void putEvents(String appId, List<Bundle> events) {
    sEvents.put(appId, events);
  }

  @Override
  public void putEventForAppId(String appId, Bundle body) {
    sEvents.get(appId).add(body);
  }

  @Override
  public boolean hasEvents(String appId) {
    return sEvents.containsKey(appId);
  }

  @Override
  public void removeEvents(String appId) {
    sEvents.remove(appId);
  }

  @Override
  public List<Bundle> getEvents(String appId) {
    return sEvents.get(appId);
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
  public Set<String> allAppIdsWithTasks() {
    return sTasks.keySet();
  }

  @Override
  public Map<String, TaskInterface> getTasks(String appId) {
    return sTasks.get(appId);
  }

  @Override
  public boolean hasTasks(String appId) {
    return sTasks.containsKey(appId);
  }

  @Override
  public void putTasks(String appId, Map<String, TaskInterface> tasks) {
    sTasks.put(appId, tasks);
  }

  @Override
  public void removeTasks(String appId) {
    sTasks.remove(appId);
  }

  @Override
  public void removeTask(String appId, String taskName) {
    if (sTasks.containsKey(appId)) {
      Objects.requireNonNull(sTasks.get(appId)).remove(taskName);
    }
  }

  @Override
  public void persistTasksForAppId(SharedPreferences preferences, String appId) {
    tasksPersistence.persistTasksForAppId(preferences, appId, getTasks(appId));
  }

  @Override
  public Map<String, AppConfig> readPersistedTasks(SharedPreferences preferences) {
    return tasksPersistence.readPersistedTasks(preferences);
  }
}
