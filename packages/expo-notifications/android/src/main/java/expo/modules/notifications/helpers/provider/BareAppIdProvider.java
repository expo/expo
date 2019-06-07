package expo.modules.notifications.helpers.provider;

import android.content.Context;

import org.unimodules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import expo.modules.notifications.configuration.Configuration;

public class BareAppIdProvider implements InternalModule, AppIdProvider{

    private Context mContext;

    public BareAppIdProvider(Context context) {
        mContext = context.getApplicationContext();
    }

    public String getAppId() {
        String appId = Configuration.getValueFor(Configuration.APP_ID_KEY, mContext);
        return appId;
    }

    @Override
    public List<? extends Class> getExportedInterfaces() {
        return Collections.singletonList(AppIdProvider.class);
    }

}
