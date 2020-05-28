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

public interface TasksAndEventsRepository {

  static TasksAndEventsRepository create(Context context) {
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
