package expo.modules.developmentclient.unimodules.core.interfaces;

import expo.modules.developmentclient.unimodules.core.ModuleRegistry;

import java.util.List;

/**
 * Interface for "Expo" modules -- modules available over {@link ModuleRegistry},
 * implementing some external-package interface.
 * <p>
 * Eg. `com.filesystem.FileSystem` could implement `expo.modules.developmentclient.unimodules.interfaces.filesystem.FileSystem`
 * and export this interface in {@link #getExportedInterfaces()}. This way {@link ModuleRegistry}
 * will be able to pick it up and register as a provider for this interface, in case some other module
 * asks for `expo.modules.developmentclient.unimodules.interfaces.filesystem.FileSystem` provider.
 */
public interface InternalModule extends RegistryLifecycleListener {
  List<? extends Class> getExportedInterfaces();
}
