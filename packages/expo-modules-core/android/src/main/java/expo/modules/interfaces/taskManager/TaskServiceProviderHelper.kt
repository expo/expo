package expo.modules.interfaces.taskManager

import android.content.Context
import expo.modules.core.ModulePriorities
import expo.modules.core.interfaces.Package

class TaskServiceProviderHelper {
  companion object {
    /*
      Uses reflection to look through the current list of packages and attempts to find
      one that provides a TaskServiceInterface implementation.
     */
    fun getTaskServiceImpl(context: Context): TaskServiceInterface? {
      // Use reflection to get the packages list from ExpoModulesPackageList without
      // creating the reactInstanceManager:
      val expoModules: Class<*>? = try {
        Class.forName("expo.modules.ExpoModulesPackageList")
      } catch (e: ClassNotFoundException) {
        // Handle the exception, e.g., log it or fallback to a default behavior
        return null
      }
      val getPackageList = expoModules?.getMethod("getPackageList") ?: return null

      // Invoke and get the list of packages
      val result = getPackageList.invoke(null) as? List<*> ?: return null
      val packages = result.filterIsInstance<Package>()
        .sortedByDescending { ModulePriorities.get(it::class.qualifiedName) }

      // Check if any of the packages are providing a task manager implementation
      return packages
        .filterIsInstance<TaskServiceProviderPackage>()
        .firstOrNull()
        ?.getTaskServiceImpl(context)
    }
  }
}
