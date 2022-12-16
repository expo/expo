package expo.modules.taskManager.repository;

import android.content.SharedPreferences;
import android.os.Bundle;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import androidx.annotation.NonNull;

import expo.modules.interfaces.taskManager.TaskInterface;

/**
 * Implementation of {@link TasksAndEventsRepository} to be used in bare workflow.
 *
 * It stores tasks and events by in relation to appScopeKey. However, upon retrieval it ignores appScopeKey and returns all stored tasks and events.
 *
 * In bare workflow there is no reason to map appScopeKey to task, since there is only one appScopeKey. However, we maintain this structure for some reasons:
 *  1. Maintaining as much similarity as possible, due to delegation of persistent storage functionality
 *  2. It might happen, after migration from managed to bare workflow, that there are some tasks under different appScopeKeys stored already
 *
 *  For the sake of simplicity and avoiding potential bugs, we change the behavior as minimally as possible.
 *  In very unlikely scenario of having more than one appScopeKey in bare, we merge all tasks into one list upon retrieval.
 *  While storing, we clear all info that is not associated with current appScopeKey to avoid future confusions.
 */
public class BareTasksAndEventsRepository implements TasksAndEventsRepository {

  private final TasksPersistence tasksPersistence;

  private static Map<String, List<Bundle>> sEvents = new HashMap<>();
  private static Map<String, Map<String, TaskInterface>> sTasks;

  public BareTasksAndEventsRepository(TasksPersistence tasksPersistence) {
    this.tasksPersistence = tasksPersistence;
  }

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
    List<Bundle> allEvents = new LinkedList<>();
    for(List<Bundle> value: sEvents.values()) {
      allEvents.addAll(value);
    }
    return allEvents;
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
    Map<String, TaskInterface> allTasks = new HashMap<>();
    for(Map<String, TaskInterface> value: sTasks.values()) {
      allTasks.putAll(value);
    }
    return allTasks;
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
    tasksPersistence.clearTaskPersistence(preferences, appScopeKey);
    tasksPersistence.persistTasksForAppScopeKey(preferences, appScopeKey, getTasks(appScopeKey));
  }

  @Override
  public Map<String, AppConfig> readPersistedTasks(SharedPreferences preferences) {
    return tasksPersistence.readPersistedTasks(preferences);
  }
}
