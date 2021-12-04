// Copyright 2015-present 650 Industries. All rights reserved.
package abi44_0_0.host.exp.exponent

import android.content.Context
import android.os.Looper
import abi44_0_0.com.facebook.react.ReactPackage
import abi44_0_0.com.facebook.react.bridge.NativeModule
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.com.facebook.react.uimanager.ViewManager
import abi44_0_0.expo.modules.adapters.react.ReactModuleRegistryProvider
import abi44_0_0.expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import abi44_0_0.expo.modules.random.RandomModule
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.analytics.EXL
import host.exp.exponent.kernel.ExperienceKey
/* WHEN_VERSIONING_REMOVE_FROM_HERE
import host.exp.exponent.kernel.ExponentKernelModuleProvider
WHEN_VERSIONING_REMOVE_TO_HERE */
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.utils.ScopedContext
import org.json.JSONException
import abi44_0_0.host.exp.exponent.modules.api.*
import abi44_0_0.host.exp.exponent.modules.api.appearance.ExpoAppearanceModule
import abi44_0_0.host.exp.exponent.modules.api.appearance.ExpoAppearancePackage
import abi44_0_0.host.exp.exponent.modules.api.appearance.rncappearance.RNCAppearanceModule
import abi44_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule
import abi44_0_0.host.exp.exponent.modules.api.components.datetimepicker.RNDateTimePickerPackage
import abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule
import abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage
import abi44_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage
import abi44_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage
import abi44_0_0.host.exp.exponent.modules.api.components.maskedview.RNCMaskedViewPackage
import abi44_0_0.host.exp.exponent.modules.api.components.picker.RNCPickerPackage
import abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.StripeSdkPackage
import abi44_0_0.host.exp.exponent.modules.api.components.sharedelement.RNSharedElementModule
import abi44_0_0.host.exp.exponent.modules.api.components.sharedelement.RNSharedElementPackage
import abi44_0_0.host.exp.exponent.modules.api.components.slider.ReactSliderPackage
import abi44_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage
import abi44_0_0.host.exp.exponent.modules.api.components.pagerview.PagerViewPackage
import abi44_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewModule
import abi44_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewPackage
import abi44_0_0.host.exp.exponent.modules.api.netinfo.NetInfoModule
import abi44_0_0.host.exp.exponent.modules.api.notifications.NotificationsModule
import abi44_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule
import abi44_0_0.host.exp.exponent.modules.api.safeareacontext.SafeAreaContextPackage
import abi44_0_0.host.exp.exponent.modules.api.screens.RNScreensPackage
import abi44_0_0.host.exp.exponent.modules.api.viewshot.RNViewShotModule
import abi44_0_0.host.exp.exponent.modules.internal.DevMenuModule
import abi44_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule
import abi44_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter
import abi44_0_0.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter
import java.io.UnsupportedEncodingException

// This is an Expo module but not a unimodule
class ExponentPackage : ReactPackage {
  private val isKernel: Boolean
  private val experienceProperties: Map<String, Any?>
  private val manifest: Manifest
  private val moduleRegistryAdapter: ScopedModuleRegistryAdapter

  private constructor(
    isKernel: Boolean,
    experienceProperties: Map<String, Any?>,
    manifest: Manifest,
    expoPackages: List<Package>,
    singletonModules: List<SingletonModule>?
  ) {
    this.isKernel = isKernel
    this.experienceProperties = experienceProperties
    this.manifest = manifest
    moduleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(expoPackages, singletonModules)
  }

  constructor(
    experienceProperties: Map<String, Any?>,
    manifest: Manifest,
    expoPackages: List<Package>?,
    delegate: ExponentPackageDelegate?,
    singletonModules: List<SingletonModule>
  ) {
    isKernel = false
    this.experienceProperties = experienceProperties
    this.manifest = manifest
    val packages = expoPackages ?: ExperiencePackagePicker.packages(manifest)
    // Delegate may not be null only when the app is detached
    moduleRegistryAdapter = createModuleRegistryAdapter(delegate, singletonModules, packages)
  }

  private fun createModuleRegistryAdapter(
    delegate: ExponentPackageDelegate?,
    singletonModules: List<SingletonModule>,
    packages: List<Package>
  ): ScopedModuleRegistryAdapter {
    var registryAdapter: ScopedModuleRegistryAdapter? = null
    if (delegate != null) {
      registryAdapter = delegate.getScopedModuleRegistryAdapterForPackages(packages, singletonModules)
    }
    if (registryAdapter == null) {
      registryAdapter = createDefaultModuleRegistryAdapterForPackages(packages, singletonModules)
    }
    return registryAdapter
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    val isVerified = manifest.isVerified() ?: false
    val nativeModules: MutableList<NativeModule> = mutableListOf(
      URLHandlerModule(reactContext),
      ShakeModule(reactContext),
      KeyboardModule(reactContext)
    )

    if (isKernel) {
      /* WHEN_VERSIONING_REMOVE_FROM_HERE
      nativeModules.add((ExponentKernelModuleProvider.newInstance(reactContext) as NativeModule?)!!)
      WHEN_VERSIONING_REMOVE_TO_HERE */
    }
    if (!isKernel && !Constants.isStandaloneApp()) {
      // We need DevMenuModule only in non-home and non-standalone apps.
      nativeModules.add(DevMenuModule(reactContext, experienceProperties, manifest))
    }

    if (isVerified) {
      try {
        val experienceKey = ExperienceKey.fromManifest(manifest)
        val scopedContext = ScopedContext(reactContext, experienceKey)
        nativeModules.add(NotificationsModule(reactContext, experienceKey, manifest.getStableLegacyID(), manifest.getEASProjectID()))
        nativeModules.add(RNViewShotModule(reactContext, scopedContext))
        nativeModules.add(RandomModule(reactContext))
        nativeModules.add(ExponentTestNativeModule(reactContext))
        nativeModules.add(PedometerModule(reactContext))
        nativeModules.add(ScreenOrientationModule(reactContext))
        nativeModules.add(RNGestureHandlerModule(reactContext))
        nativeModules.add(RNAWSCognitoModule(reactContext))
        nativeModules.add(ReanimatedModule(reactContext))
        nativeModules.add(RNCWebViewModule(reactContext))
        nativeModules.add(NetInfoModule(reactContext))
        nativeModules.add(RNSharedElementModule(reactContext))

        // @tsapeta: Using ExpoAppearanceModule in home app causes some issues with the dev menu,
        // when home's setting is set to automatic and the system theme is different
        // than this supported by the experience in which we opened the dev menu.
        if (isKernel) {
          nativeModules.add(RNCAppearanceModule(reactContext))
        } else {
          nativeModules.add(ExpoAppearanceModule(reactContext))
        }

        nativeModules.addAll(SvgPackage().createNativeModules(reactContext))
        nativeModules.addAll(MapsPackage().createNativeModules(reactContext))
        nativeModules.addAll(RNDateTimePickerPackage().createNativeModules(reactContext))
        nativeModules.addAll(stripePackage.createNativeModules(reactContext))

        // Call to create native modules has to be at the bottom --
        // -- ExpoModuleRegistryAdapter uses the list of native modules
        // to create Bindings for internal modules.
        nativeModules.addAll(
          moduleRegistryAdapter.createNativeModules(
            scopedContext,
            experienceKey,
            experienceProperties,
            manifest,
            nativeModules
          )
        )
      } catch (e: JSONException) {
        EXL.e(TAG, e.toString())
      } catch (e: UnsupportedEncodingException) {
        EXL.e(TAG, e.toString())
      }
    }
    return nativeModules
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    val viewManagers = mutableListOf<ViewManager<*, *>>()

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(
      reactContext,
      viewManagers,
      listOf(
        SvgPackage(),
        MapsPackage(),
        LottiePackage(),
        RNGestureHandlerPackage(),
        RNScreensPackage(),
        RNCWebViewPackage(),
        SafeAreaContextPackage(),
        RNSharedElementPackage(),
        RNDateTimePickerPackage(),
        RNCMaskedViewPackage(),
        RNCPickerPackage(),
        ReactSliderPackage(),
        PagerViewPackage(),
        ExpoAppearancePackage(),
        stripePackage
      )
    )
    viewManagers.addAll(moduleRegistryAdapter.createViewManagers(reactContext))
    return viewManagers
  }

  private fun addViewManagersFromPackages(
    reactContext: ReactApplicationContext,
    viewManagers: MutableList<ViewManager<*, *>>,
    packages: List<ReactPackage>
  ) {
    for (pack in packages) {
      viewManagers.addAll(pack.createViewManagers(reactContext))
    }
  }

  private fun createDefaultModuleRegistryAdapterForPackages(
    packages: List<Package>,
    singletonModules: List<SingletonModule>?
  ): ExpoModuleRegistryAdapter {
    return ExpoModuleRegistryAdapter(ReactModuleRegistryProvider(packages, singletonModules))
  }

  companion object {
    private val TAG = ExponentPackage::class.java.simpleName

    private val singletonModules = mutableListOf<SingletonModule>()
    private val singletonModulesClasses = mutableSetOf<Class<*>>()

    // Need to avoid initializing 2 StripeSdkPackages
    private val stripePackage = StripeSdkPackage()

    fun kernelExponentPackage(
      context: Context,
      manifest: Manifest,
      expoPackages: List<Package>,
      initialURL: String?
    ): ExponentPackage {
      val kernelExperienceProperties = mutableMapOf(
        KernelConstants.LINKING_URI_KEY to "exp://",
        KernelConstants.IS_HEADLESS_KEY to false
      ).apply {
        if (initialURL != null) {
          this[KernelConstants.INTENT_URI_KEY] = initialURL
        }
      }
      val singletonModules = getOrCreateSingletonModules(context, manifest, expoPackages)
      return ExponentPackage(
        true,
        kernelExperienceProperties,
        manifest,
        expoPackages,
        singletonModules
      )
    }

    fun getOrCreateSingletonModules(
      context: Context?,
      manifest: Manifest?,
      providedExpoPackages: List<Package>?
    ): List<SingletonModule> {
      if (Looper.getMainLooper() != Looper.myLooper()) {
        throw RuntimeException("Singleton modules must be created on the main thread.")
      }

      val expoPackages = providedExpoPackages ?: ExperiencePackagePicker.packages(manifest)

      for (expoPackage in expoPackages) {
        // For now we just accumulate more and more singleton modules,
        // but in fact we should only return singleton modules from the requested
        // unimodules. This solution also unnecessarily creates singleton modules
        // which are going to be deallocated in a tick, but there's no better solution
        // without a bigger-than-minimal refactor. In SDK32 the only singleton module
        // is TaskService which is safe to initialize more than once.
        val packageSingletonModules = expoPackage.createSingletonModules(context)
        for (singletonModule in packageSingletonModules) {
          if (!singletonModulesClasses.contains(singletonModule.javaClass)) {
            singletonModules.add(singletonModule)
            singletonModulesClasses.add(singletonModule.javaClass)
          }
        }
      }

      return singletonModules
    }
  }
}
