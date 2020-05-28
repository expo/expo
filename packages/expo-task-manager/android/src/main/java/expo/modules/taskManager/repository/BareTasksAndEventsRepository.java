package expo.modules.taskManager.repository;

import android.content.SharedPreferences;
import android.os.Bundle;

import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import androidx.annotation.NonNull;

/**
 * Implementation of {@link TasksAndEventsRepository} to be used in bare workflow.
 *
 * It stores tasks and events by in relation to appId. However, upon retrieval it ignores appId and returns all stored tasks and events.
 *
 * In bare workflow there is no reason to map appId to task, since there is only one appId. However, we maintain this structure for some reasons:
 *  1. Maintaining as much similarity as possible, due to delegation of persistent storage functionality
 *  2. It might happen, after migration from managed to bare workflow, that there are some tasks under different appIds stored already
 *
 *  For the sake of simplicity and avoiding potential bugs, we change the behavior as minimally as possible.
 *  In very unlikely scenario of having more than one appId in bare, we merge all tasks into one list upon retrieval.
 *  While storing, we clear all info that is not associated with current appId to avoid future confusions.
 */
public class BareTasksAndEventsRepository implements TasksAndEventsRepository {

  private final TasksPersistence tasksPersistence;

  private static Map<String, List<Bundle>> sEvents = new HashMap<>();
  private static Map<String, Map<String, TaskInterface>> sTasks;

  public BareTasksAndEventsRepository(TasksPersistence tasksPersistence) {
    this.tasksPersistence = tasksPersistence;
  }

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
  public Set<String> allAppIdsWithTasks() {
    return sTasks.keySet();
  }

  @Override
  public Map<String, TaskInterface> getTasks(String appId) {
    Map<String, TaskInterface> allTasks = new HashMap<>();
    for(Map<String, TaskInterface> value: sTasks.values()) {
      allTasks.putAll(value);
    }
    return allTasks;
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
  public void persistTasksForAppId(SharedPreferences preferences, String appId) {
    tasksPersistence.clearTaskPersistence(preferences, appId);
    tasksPersistence.persistTasksForAppId(preferences, appId, getTasks(appId));
  }

  @Override
  public Map<String, AppConfig> readPersistedTasks(SharedPreferences preferences) {
    return tasksPersistence.readPersistedTasks(preferences);
  }
}
