package expo.modules.taskManager.repository;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;

import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.List;
import java.util.Map;
import java.util.Set;

import androidx.annotation.NonNull;

/**
 * Class used to store Tasks and Events for TaskManager.
 *
 * Tasks and Events are stored in static collections, thanks to which they remain intact during whole application lifetime.
 * Additionally, it provides means to persistently store and restore Tasks whenever necessary.
 *
 * Differences in behavior are dictated by different approach in managed and bare workflow. See {@link ManagedTasksAndEventsRepository} and {@link BareTasksAndEventsRepository} for details.
 */
public interface TasksAndEventsRepository {

  /**
   * This factory methods tries to detect which strategy for storage and retrieving of stored tasks would be appropriate.
   *
   * Decision is based on value of metadata for *expo.modules.taskManager.oneAppId* which should be set to *true* in bare applications and to *false* in managed and in Client.
   * This is due to the fact, that the value is originally set in *expo-task-manager's* AndroidManifest.xml and replaced in *expoview's* one.
   * The latter is present only in managed workflow, the former is the only one in bare applications.
   *
   * @return Proper implementation of TasksAndEventsRepository
   */
  static TasksAndEventsRepository create(@NonNull Context context) {
    String oneAppIdMetadata = "expo.modules.taskManager.oneAppId";
    boolean oneAppId = false;
    try {
      oneAppId = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA).metaData.getBoolean(oneAppIdMetadata);
    } catch (PackageManager.NameNotFoundException ignore) {
    }
    if(oneAppId) {
      return new BareTasksAndEventsRepository(new TasksPersistence());
    } else {
      return new ManagedTasksAndEventsRepository(new TasksPersistence());
    }
  }

  class AppConfig {
    public String appUrl;
    public Map<String, Object> tasks;
  }

  void putEvents(String appId, List<Bundle> events);
  void putEventForAppId(String appId, Bundle body);
  boolean hasEvents(String appId);
  void removeEvents(String appId);
  List<Bundle> getEvents(String appId);

  boolean tasksExist();
  void createTasks();
  @NonNull Set<String> allAppIdsWithTasks();
  Map<String, TaskInterface> getTasks(String appId);
  boolean hasTasks(String appId);
  void putTasks(String appId, Map<String, TaskInterface> tasks);
  void removeTasks(String appId);
  void persistTasksForAppId(SharedPreferences preferences, String appId);
  Map<String, AppConfig> readPersistedTasks(SharedPreferences preferences);
}
