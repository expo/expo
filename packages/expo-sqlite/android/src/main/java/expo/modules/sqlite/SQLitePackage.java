package expo.modules.sqlite;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.interfaces.SingletonModule;

public class SQLitePackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new SQLiteModule(context));
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.singletonList((SingletonModule) new SQLiteDependencyLoader(context));
  }
}
