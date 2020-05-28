package expo.modules.taskManager.repository;

import android.content.SharedPreferences;
import android.os.Debug;

import org.json.JSONObject;
import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.HashMap;
import java.util.Map;

import static expo.modules.taskManager.Utils.exportTaskToMap;
import static expo.modules.taskManager.Utils.jsonToMap;

public class TasksPersistence {

  public void clearTaskPersistence(SharedPreferences preferences, String but) {
    Map<String, ?> map = preferences.getAll();
    for(String key: map.keySet()) {
      if(!but.equals(key)) {
        preferences.edit().remove(key).apply();
      }
    }
  }

  public void persistTasksForAppId(SharedPreferences preferences, String appId, Map<String, TaskInterface> appRow) {

    if (preferences == null) {
      return;
    }
    if (appRow == null || appRow.size() == 0) {
      preferences.edit().remove(appId).apply();
      return;
    }

    Map<String, Object> appConfig = new HashMap<>();
    Map<String, Object> tasks = new HashMap<>();
    String appUrl = null;

    for (TaskInterface task : appRow.values()) {
      Map<String, Object> taskConfig = exportTaskToMap(task);
      tasks.put(task.getName(), taskConfig);
      appUrl = task.getAppUrl();
    }

    appConfig.put("appUrl", appUrl);
    appConfig.put("tasks", tasks);

    preferences
      .edit()
      .putString(appId, new JSONObject(appConfig).toString())
      .apply();
  }

  public Map<String, TasksAndEventsRepository.AppConfig> readPersistedTasks(SharedPreferences preferences) {
    Map<String, TasksAndEventsRepository.AppConfig> result = new HashMap<>();

    Map<String, ?> appIdToAppConfigsMap = preferences.getAll();

    for (Map.Entry<String, ?> appIdToConfig : appIdToAppConfigsMap.entrySet()) {
      Map<String, Object> appConfig = jsonToMap(appIdToConfig.getValue().toString());
      String appUrl = (String) appConfig.get("appUrl");
      Map<String, Object> tasksConfig = (HashMap<String, Object>) appConfig.get("tasks");

      if (appUrl != null && tasksConfig != null && tasksConfig.size() > 0) {
        Map<String, Object> tasksForApp = new HashMap<>();
        for (String taskName : tasksConfig.keySet()) {
          tasksForApp.put(taskName, tasksConfig.get(taskName));
        }
        TasksAndEventsRepository.AppConfig app = new TasksAndEventsRepository.AppConfig();
        app.appUrl = appUrl;
        app.tasks = tasksForApp;
        result.put(appIdToConfig.getKey(), app);
      }
    }

    return result;

  }

}
