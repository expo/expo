package com.otabare;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.facebook.stetho.Stetho;
import com.otabare.generated.BasePackageList;

import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;
import org.unimodules.core.interfaces.Package;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.annotation.Nullable;

import expo.modules.ota.ExpoOTA;
import expo.modules.ota.ExpoOTAConfig;
import expo.modules.ota.ExpoOTAConfigKt;
import expo.modules.ota.OtaPackage;

public class MainApplication extends Application implements ReactApplication {

    private ExpoOTA expoOTA;

    private ReactModuleRegistryProvider createReactModuleRegistryProvider() {
        List<Package> basePackages = new BasePackageList().getPackageList();
        List<Package> packages = new ArrayList<>(basePackages);
        packages.add(new OtaPackage());
        return new ReactModuleRegistryProvider(packages, Arrays.asList());
    }

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.asList(
                    new MainReactPackage(),
                    new ModuleRegistryAdapter(createReactModuleRegistryProvider())
            );
        }

        @Nullable
        @Override
        protected String getJSBundleFile() {
            if (!BuildConfig.DEBUG) {
                return expoOTA.getBundlePath();
            } else {
                return null;
            }
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
        if (!BuildConfig.DEBUG) {
            expoOTA = createExpoOTA();
        }
    }

    private ExpoOTA createExpoOTA() {
        return ExpoOTA.init(this, false);
    }
}
