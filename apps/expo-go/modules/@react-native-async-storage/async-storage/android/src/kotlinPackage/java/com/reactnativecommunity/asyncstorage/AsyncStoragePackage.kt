package com.reactnativecommunity.asyncstorage

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.reactnativecommunity.asyncstorage.next.StorageModule

@ReactModuleList(
    nativeModules = [
        StorageModule::class
    ]
)
class AsyncStoragePackage : TurboReactPackage() {
    override fun getModule(name: String, context: ReactApplicationContext): NativeModule? = when (name) {
        StorageModule.NAME -> StorageModule(context)
        else -> null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        try {
            val reactModuleInfoProviderClass =
                Class.forName("com.reactnativecommunity.asyncstorage.AsyncStoragePackage$\$ReactModuleInfoProvider")
            return reactModuleInfoProviderClass.newInstance() as ReactModuleInfoProvider
        } catch (e: ClassNotFoundException) {
            return ReactModuleInfoProvider {
                val isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                val reactModule: ReactModule = StorageModule::class.java.getAnnotation(
                    ReactModule::class.java)!!

                mapOf(
                    StorageModule.NAME to ReactModuleInfo(
                        reactModule.name,
                        StorageModule::class.java.name,
                        reactModule.canOverrideExistingModule,
                        reactModule.needsEagerInit,
                        reactModule.hasConstants,
                        reactModule.isCxxModule,
                        isTurboModule
                    )
                )
            }
        } catch (e: InstantiationException) {
            throw RuntimeException("No ReactModuleInfoProvider for AsyncStoragePackage$\$ReactModuleInfoProvider", e)
        } catch (e: IllegalAccessException) {
            throw RuntimeException("No ReactModuleInfoProvider for AsyncStoragePackage$\$ReactModuleInfoProvider", e)
        }
    }
}
