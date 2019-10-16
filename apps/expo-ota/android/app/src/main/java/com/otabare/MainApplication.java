package com.otabare;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.facebook.stetho.Stetho;
import com.otabare.generated.BasePackageList;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.swmansion.reanimated.ReanimatedPackage;

import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;

import java.util.Arrays;
import java.util.List;

import javax.annotation.Nullable;

import expo.modules.ota.ExpoOTA;
import expo.modules.ota.ExpoOTAConfig;
import expo.modules.ota.ExpoOTAConfigKt;

public class MainApplication extends Application implements ReactApplication {

    private ExpoOTA expoOTA;

    private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
            new BasePackageList().getPackageList(),
            Arrays.asList()
    );

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.asList(
                    new MainReactPackage(),
                    new ReanimatedPackage(),
                    new RNGestureHandlerPackage(),
                    new ModuleRegistryAdapter(mModuleRegistryProvider)
            );
        }

        @Nullable
        @Override
        protected String getJSBundleFile() {
            return expoOTA.getBundlePath();
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        Stetho.initializeWithDefaults(this);
        expoOTA = createExpoOTA();
        expoOTA.init();
    }

    private ExpoOTA createExpoOTA() {
        ExpoOTAConfig otaConfig = ExpoOTAConfigKt.expoHostedOTAConfig("mczernek", "expo-template-bare", "test", false);
        return ExpoOTA.create(this, otaConfig, false);
    }
}
