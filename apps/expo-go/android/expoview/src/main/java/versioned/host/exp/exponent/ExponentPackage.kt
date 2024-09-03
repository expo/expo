// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent

import android.content.Context
import android.os.Looper
import android.util.Log
import com.airbnb.android.react.lottie.LottiePackage
import com.facebook.react.ReactPackage
import com.th3rdwave.safeareacontext.SafeAreaContextPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.horcrux.svg.SvgPackage
import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage
import com.reactnativecommunity.netinfo.NetInfoModule
import com.reactnativecommunity.picker.RNCPickerPackage
import com.reactnativecommunity.slider.ReactSliderPackage
import com.reactnativecommunity.webview.RNCWebViewModule
import com.reactnativecommunity.webview.RNCWebViewPackage
import com.reactnativepagerview.PagerViewPackage
import com.reactnativestripesdk.StripeSdkPackage
import com.shopify.reactnative.flash_list.ReactNativeFlashListPackage
import com.shopify.reactnative.skia.RNSkiaPackage
import com.rnmaps.maps.MapsPackage
import com.swmansion.gesturehandler.RNGestureHandlerPackage
import com.swmansion.gesturehandler.react.RNGestureHandlerModule
import com.swmansion.reanimated.ReanimatedModule
import com.swmansion.rnscreens.RNScreensPackage
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import expo.modules.kotlin.ModulesProvider
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.ExponentKernelModuleProvider
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.utils.ScopedContext
import org.json.JSONException
import org.reactnative.maskedview.RNCMaskedViewPackage
import versioned.host.exp.exponent.modules.api.KeyboardModule
import versioned.host.exp.exponent.modules.api.PedometerModule
import versioned.host.exp.exponent.modules.api.ScreenOrientationModule
import versioned.host.exp.exponent.modules.api.ShakeModule
import versioned.host.exp.exponent.modules.api.URLHandlerModule
import versioned.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule
import versioned.host.exp.exponent.modules.api.notifications.NotificationsModule
import versioned.host.exp.exponent.modules.api.viewshot.RNViewShotModule
import versioned.host.exp.exponent.modules.internal.DevMenuModule
import versioned.host.exp.exponent.modules.internal.ExponentAsyncStorageModule
import versioned.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule
import versioned.host.exp.exponent.modules.test.ExponentTestNativeModule
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter
import versioned.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter
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
    moduleProvider: ModulesProvider,
    singletonModules: List<SingletonModule>?
  ) {
    this.isKernel = isKernel
    this.experienceProperties = experienceProperties
    this.manifest = manifest
    moduleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(expoPackages, singletonModules, moduleProvider)
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
      registryAdapter = createDefaultModuleRegistryAdapterForPackages(packages, singletonModules, ExperiencePackagePicker)
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
    nativeModules.add(if (isVerified) ExponentAsyncStorageModule(reactContext, manifest) else ExponentUnsignedAsyncStorageModule(reactContext))

    if (isKernel) {
      // WHEN_VERSIONING_REMOVE_FROM_HERE
      nativeModules.add((ExponentKernelModuleProvider.newInstance(reactContext) as NativeModule?)!!)
      // WHEN_VERSIONING_REMOVE_TO_HERE
    }
    if (!isKernel) {
      // We need DevMenuModule only in non-home apps.
      nativeModules.add(DevMenuModule(reactContext, experienceProperties, manifest))
    }

    if (isVerified) {
      try {
        val experienceKey = ExperienceKey.fromManifest(manifest)
        val scopedContext = ScopedContext(reactContext, experienceKey)
        nativeModules.add(NotificationsModule(reactContext, experienceKey, manifest.getStableLegacyID(), manifest.getEASProjectID()))
        nativeModules.add(RNViewShotModule(reactContext, scopedContext))
        nativeModules.add(ExponentTestNativeModule(reactContext))
        nativeModules.add(PedometerModule(reactContext))
        nativeModules.add(ScreenOrientationModule(reactContext))
        nativeModules.add(RNGestureHandlerModule(reactContext))
        nativeModules.add(RNAWSCognitoModule(reactContext))
        nativeModules.add(RNCWebViewModule(reactContext))
        nativeModules.add(NetInfoModule(reactContext))
        nativeModules.addAll(SvgPackage().getNativeModuleIterator(reactContext).map { it.module })
        nativeModules.addAll(MapsPackage().createNativeModules(reactContext))
        nativeModules.addAll(RNDateTimePickerPackage().getNativeModuleIterator(reactContext).map { it.module })
        nativeModules.addAll(stripePackage.createNativeModules(reactContext))
        nativeModules.addAll(skiaPackage.createNativeModules(reactContext))

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
        RNDateTimePickerPackage(),
        RNCMaskedViewPackage(),
        RNCPickerPackage(),
        ReactSliderPackage(),
        PagerViewPackage(),
        SafeAreaContextPackage(),
        stripePackage,
        skiaPackage,
        ReactNativeFlashListPackage()
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
    singletonModules: List<SingletonModule>?,
    modulesProvider: ModulesProvider? = null
  ): ExpoModuleRegistryAdapter {
    return ExpoModuleRegistryAdapter(ReactModuleRegistryProvider(packages, singletonModules), modulesProvider)
  }

  companion object {
    private val TAG = ExponentPackage::class.java.simpleName

    private val singletonModules = mutableListOf<SingletonModule>()
    private val singletonModulesClasses = mutableSetOf<Class<*>>()

    // Need to avoid initializing duplicated packages
    private val stripePackage = StripeSdkPackage()
    private val skiaPackage = RNSkiaPackage()

    fun kernelExponentPackage(
      context: Context,
      manifest: Manifest,
      expoPackages: List<Package>,
      modulesProvider: ModulesProvider,
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
        modulesProvider,
        singletonModules
      )
    }

    fun getOrCreateSingletonModules(
      context: Context?,
      manifest: Manifest?,
      providedExpoPackages: List<Package>?
    ): List<SingletonModule> {
//      if (Looper.getMainLooper() != Looper.myLooper()) {
//        throw RuntimeException("Singleton modules must be created on the main thread.")
//      }

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
