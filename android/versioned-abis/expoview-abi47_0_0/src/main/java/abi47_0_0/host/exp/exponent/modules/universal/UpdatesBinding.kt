// Copyright 2020-present 650 Industries. All rights reserved.
package abi47_0_0.host.exp.exponent.modules.universal

import android.content.Context
import javax.inject.Inject
import host.exp.exponent.ExpoUpdatesAppLoader
import expo.modules.updates.UpdatesConfiguration
import abi47_0_0.expo.modules.updates.UpdatesInterface
import abi47_0_0.expo.modules.updates.UpdatesService
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import host.exp.exponent.kernel.KernelProvider
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.KernelConstants
import java.io.File

/**
 * Scoped internal module which overrides [UpdatesService] at runtime in Expo Go, and gives
 * [UpdatesModule] access to the correct instance of [ExpoUpdatesAppLoader].
 */
class UpdatesBinding(context: Context, experienceProperties: Map<String, Any?>) :
  UpdatesService(context), UpdatesInterface {

  @Inject
  lateinit var databaseHolderInternal: DatabaseHolder

  private var manifestUrl: String?
  private var appLoader: ExpoUpdatesAppLoader?

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(UpdatesInterface::class.java as Class<*>)
  }

  override val configuration: UpdatesConfiguration
    get() = appLoader!!.updatesConfiguration

  override val selectionPolicy: SelectionPolicy
    get() = appLoader!!.selectionPolicy

  override val directory: File
    get() = appLoader!!.updatesDirectory

  override val fileDownloader: FileDownloader
    get() = appLoader!!.fileDownloader

  override val databaseHolder: DatabaseHolder
    get() = databaseHolderInternal

  override val isEmergencyLaunch: Boolean
    get() = appLoader!!.isEmergencyLaunch

  override val isUsingEmbeddedAssets: Boolean
    get() = false

  override fun canRelaunch(): Boolean {
    return true
  }

  override val embeddedUpdate: UpdateEntity? = null

  override val launchedUpdate: UpdateEntity?
    get() = appLoader!!.launcher.launchedUpdate

  override val localAssetFiles: Map<AssetEntity, String>?
    get() = appLoader!!.launcher.localAssetFiles

  override fun relaunchReactApplication(callback: LauncherCallback) {
    KernelProvider.instance.reloadVisibleExperience(manifestUrl!!, true)
    callback.onSuccess()
  }

  override fun resetSelectionPolicy() {
    // no-op in managed
  }

  companion object {
    private val TAG = UpdatesBinding::class.java.simpleName
  }

  init {
    NativeModuleDepsProvider.instance.inject(UpdatesBinding::class.java, this)
    manifestUrl = experienceProperties[KernelConstants.MANIFEST_URL_KEY] as String?
    appLoader = KernelProvider.instance.getAppLoaderForManifestUrl(manifestUrl)
  }
}
