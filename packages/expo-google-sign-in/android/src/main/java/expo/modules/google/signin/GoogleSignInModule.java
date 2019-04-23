package expo.modules.google.signin;


import android.accounts.Account;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.android.gms.auth.GoogleAuthException;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.Scopes;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.constants.ConstantsInterface;

import static expo.modules.google.signin.Serialization.getExceptionCode;
import static expo.modules.google.signin.Serialization.getSignInOptions;
import static expo.modules.google.signin.Serialization.jsonFromGoogleUser;
import static expo.modules.google.signin.Serialization.scopesToString;

public class GoogleSignInModule extends ExportedModule implements ModuleRegistryConsumer {
    public static final int RC_LOG_IN = 1737;
    public static final int RC_PLAY_SERVICES = 2404;
    public static final String MODULE_NAME = "ExpoGoogleSignIn";
    protected static final String ERROR_CONCURRENT_TASK_IN_PROGRESS = "E_CONCURRENT_TASK_IN_PROGRESS";
    protected static final String ERROR_EXCEPTION = "E_GOOGLE_SIGN_IN";
    private final ActivityEventListener mActivityEventListener = new GoogleSignInActivityEventListener();
    private GoogleSignInClient _apiClient;
    private AuthTask authTask = new AuthTask();
    private ModuleRegistry mModuleRegistry;


    public GoogleSignInModule(Context context) {
        super(context);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @Override
    public void setModuleRegistry(ModuleRegistry moduleRegistry) {

        mModuleRegistry = moduleRegistry;

        if (moduleRegistry != null) {
            mModuleRegistry.getModule(UIManager.class).registerActivityEventListener(mActivityEventListener);
        }
    }

    /**
     * Subclasses can use this method to access catalyst context passed as a constructor
     */
    protected final Context getApplicationContext() {
        return getContext().getApplicationContext();
    }

    /**
     * Get the activity to which this context is currently attached, or {@code null} if not attached.
     * <p>
     * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
     * MEMORY LEAKS.
     * <p>
     * For example, never store the value returned by this method in a member variable. Instead, call
     * this method whenever you actually need the Activity and make sure to check for {@code null}.
     */
    protected @Nullable
    final Activity getCurrentActivity() {
        ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
        return activityProvider.getCurrentActivity();
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();

        final Map<String, Object> errors = new HashMap<>();

        errors.put("SIGN_IN_CANCELLED", String.valueOf(GoogleSignInStatusCodes.SIGN_IN_CANCELLED));
        errors.put("TASK_IN_PROGRESS", ERROR_CONCURRENT_TASK_IN_PROGRESS);
        errors.put("SIGN_IN_FAILED", String.valueOf(GoogleSignInStatusCodes.SIGN_IN_FAILED));
        errors.put("SIGN_IN_REQUIRED", String.valueOf(CommonStatusCodes.SIGN_IN_REQUIRED));
        errors.put("INVALID_ACCOUNT", String.valueOf(CommonStatusCodes.INVALID_ACCOUNT));

        errors.put("SIGN_IN_NETWORK_ERROR", String.valueOf(CommonStatusCodes.NETWORK_ERROR));
        errors.put("SIGN_IN_EXCEPTION", ERROR_EXCEPTION);

        final Map<String, Object> scopes = new HashMap<>();
        scopes.put("PROFILE", Scopes.PROFILE);
        scopes.put("EMAIL", Scopes.EMAIL);
        scopes.put("OPEN_ID", Scopes.OPEN_ID);
        scopes.put("PLUS_ME", Scopes.PLUS_ME);
        scopes.put("GAMES", Scopes.GAMES);
        scopes.put("GAMES_LITE", Scopes.GAMES_LITE);
        scopes.put("CLOUD_SAVE", Scopes.CLOUD_SAVE);
        scopes.put("APP_STATE", Scopes.APP_STATE);
        scopes.put("DRIVE_FILE", Scopes.DRIVE_FILE);
        scopes.put("DRIVE_APPFOLDER", Scopes.DRIVE_APPFOLDER);
        scopes.put("DRIVE_FULL", Scopes.DRIVE_FULL);
        scopes.put("DRIVE_APPS", Scopes.DRIVE_APPS);
        scopes.put("FITNESS_ACTIVITY_READ", Scopes.FITNESS_ACTIVITY_READ);
        scopes.put("FITNESS_ACTIVITY_READ_WRITE", Scopes.FITNESS_ACTIVITY_READ_WRITE);
        scopes.put("FITNESS_LOCATION_READ", Scopes.FITNESS_LOCATION_READ);
        scopes.put("FITNESS_LOCATION_READ_WRITE", Scopes.FITNESS_LOCATION_READ_WRITE);
        scopes.put("FITNESS_BODY_READ", Scopes.FITNESS_BODY_READ);
        scopes.put("FITNESS_BODY_READ_WRITE", Scopes.FITNESS_BODY_READ_WRITE);
        scopes.put("FITNESS_NUTRITION_READ", Scopes.FITNESS_NUTRITION_READ);
        scopes.put("FITNESS_NUTRITION_READ_WRITE", Scopes.FITNESS_NUTRITION_READ_WRITE);
        scopes.put("FITNESS_BLOOD_PRESSURE_READ", Scopes.FITNESS_BLOOD_PRESSURE_READ);
        scopes.put("FITNESS_BLOOD_PRESSURE_READ_WRITE", Scopes.FITNESS_BLOOD_PRESSURE_READ_WRITE);
        scopes.put("FITNESS_BLOOD_GLUCOSE_READ", Scopes.FITNESS_BLOOD_GLUCOSE_READ);
        scopes.put("FITNESS_BLOOD_GLUCOSE_READ_WRITE", Scopes.FITNESS_BLOOD_GLUCOSE_READ_WRITE);
        scopes.put("FITNESS_OXYGEN_SATURATION_READ", Scopes.FITNESS_OXYGEN_SATURATION_READ);
        scopes.put("FITNESS_OXYGEN_SATURATION_READ_WRITE", Scopes.FITNESS_OXYGEN_SATURATION_READ_WRITE);
        scopes.put("FITNESS_BODY_TEMPERATURE_READ", Scopes.FITNESS_BODY_TEMPERATURE_READ);
        scopes.put("FITNESS_BODY_TEMPERATURE_READ_WRITE", Scopes.FITNESS_BODY_TEMPERATURE_READ_WRITE);
        scopes.put("FITNESS_REPRODUCTIVE_HEALTH_READ", Scopes.FITNESS_REPRODUCTIVE_HEALTH_READ);
        scopes.put("FITNESS_REPRODUCTIVE_HEALTH_READ_WRITE", Scopes.FITNESS_REPRODUCTIVE_HEALTH_READ_WRITE);

        final Map<String, Object> signInTypes = new HashMap<>();
        scopes.put("DEFAULT", "default");
        scopes.put("GAMES", "games");


        constants.put("SCOPES", scopes);
        constants.put("ERRORS", errors);
        constants.put("TYPES", signInTypes);

        return constants;
    }

    @ExpoMethod
    public void arePlayServicesAvailableAsync(boolean shouldUpdate, Promise promise) {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            promise.reject(ERROR_EXCEPTION, "Activity is null");
            return;
        }

        GoogleApiAvailability googleApiAvailability = GoogleApiAvailability.getInstance();
        int status = googleApiAvailability.isGooglePlayServicesAvailable(activity);

        if (status != ConnectionResult.SUCCESS) {
            if (shouldUpdate && googleApiAvailability.isUserResolvableError(status)) {
                googleApiAvailability.getErrorDialog(activity, status, RC_PLAY_SERVICES).show();
            }
            promise.reject(ERROR_EXCEPTION, "Play Services are not available");
        } else {
            promise.resolve(true);
        }
    }

    @ExpoMethod
    public void getCurrentUserAsync(Promise promise) {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getApplicationContext());
        if (account == null) {
            promise.resolve(null);
            return;
        }
        promise.resolve(jsonFromGoogleUser(account));
    }

    @ExpoMethod
    public void getPhotoAsync(Number size, Promise promise) {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getApplicationContext());
        if (account == null || account.getPhotoUrl() == null) {
            // Could not get photoURL
            promise.resolve(null);
            return;
        }
        promise.resolve(account.getPhotoUrl().toString());
    }


    @ExpoMethod
    public void getTokensAsync(Boolean shouldRefresh, Promise promise) {
        final GoogleSignInClient client = getClientOrReject(promise);
        if (client == null) {
            return;
        }
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getApplicationContext());
        if (account == null) {
            promise.reject(ERROR_EXCEPTION, "getTokens requires a user to be signed in");
        }
        if (authTask.update(promise, "getTokensAsync")) {
            Bundle props = new Bundle();
            props.putString("email", account.getEmail());

            ArrayList scopes = new ArrayList();
            for (Scope scope : account.getGrantedScopes()) {
                scopes.add(scope.toString());
            }
            props.putStringArrayList("scopes", scopes);
            props.putBundle("auth", new Bundle());
            new AccessTokenRetrievalTask(this).execute(props);
        }
    }

    @ExpoMethod
    public void initAsync(
            final Map<String, Object> config,
            final Promise promise
    ) {

        String ownership = getAppOwnership();
        Context context = getApplicationContext();
        GoogleSignInOptions options = getSignInOptions(
                context,
                config,
                ownership,
                promise);

        if (options == null) return;

        _apiClient = GoogleSignIn.getClient(context, options);
        promise.resolve(true);
    }

    private String getAppOwnership() {
        ConstantsInterface constantsService = mModuleRegistry.getModule(ConstantsInterface.class);
        return constantsService.getAppOwnership();
    }

    @ExpoMethod
    public void signInSilentlyAsync(Promise promise) {
        final GoogleSignInClient client = getClientOrReject(promise);
        if (client == null) {
            return;
        }

        if (authTask.update(promise, "signInSilentlyAsync")) {
            Boolean success = addUIThreadRunnableOrReject(new Runnable() {
                @Override
                public void run() {
                    Task<GoogleSignInAccount> result = client.silentSignIn();
                    if (result.isSuccessful()) {

                        handleSignInTaskResult(result);
                    } else {
                        result.addOnCompleteListener(new OnCompleteListener() {
                            @Override
                            public void onComplete(Task task) {
                                handleSignInTaskResult(task);
                            }
                        });
                    }
                }
            }, promise);

            if (!success) {
                return;
            }
        }
    }

    private void handleSignInTaskResult(Task<GoogleSignInAccount> result) {
        try {
            GoogleSignInAccount account = result.getResult(ApiException.class);
            Bundle params = jsonFromGoogleUser(account);
            new AccessTokenRetrievalTask(this).execute(params);
        } catch (ApiException e) {
            int code = e.getStatusCode();
            authTask.reject(String.valueOf(code), GoogleSignInStatusCodes.getStatusCodeString(code));
        }
    }

    @ExpoMethod
    public void signInAsync(Promise promise) {
        final GoogleSignInClient client = getClientOrReject(promise);
        if (client == null) {
            return;
        }

        if (authTask.update(promise, "signInAsync")) {
            Boolean success = addUIThreadRunnableOrReject(new Runnable() {
                @Override
                public void run() {
                    Intent signInIntent = client.getSignInIntent();

                    Activity activity = getCurrentActivity();
                    if (activity == null) {
                        authTask.reject(ERROR_EXCEPTION, "activity is null");
                        return;
                    }
                    activity.startActivityForResult(signInIntent, RC_LOG_IN);
                }
            }, promise);

            if (!success) {
                return;
            }
        }
    }

    @ExpoMethod
    public void clearCacheAsync(final String token, Promise promise) {
        try {
            GoogleAuthUtil.clearToken(getApplicationContext(), token);
            promise.resolve(null);
        } catch (GoogleAuthException | IOException e) {
            promise.reject(ERROR_EXCEPTION, e.getMessage(), e);
        }
    }

    @ExpoMethod
    public void signOutAsync(final Promise promise) {
        GoogleSignInClient client = getClientOrReject(promise);

        if (client == null) {
            return;
        }

        client.signOut().addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                handleSignOutOrRevokeAccessTask(task, promise);
            }
        });
    }

    @ExpoMethod
    public void disconnectAsync(final Promise promise) {
        GoogleSignInClient client = getClientOrReject(promise);
        if (client == null) {
            return;
        }

        client.revokeAccess().addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                handleSignOutOrRevokeAccessTask(task, promise);
            }
        });
    }

    @ExpoMethod
    public void isConnectedAsync(final Promise promise) {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getApplicationContext());
        if (account == null) {
            promise.resolve(false);
            return;
        }
        promise.resolve(account != null);
    }

    private void handleSignOutOrRevokeAccessTask(@NonNull Task<Void> task, final Promise promise) {
        if (task.isSuccessful()) {
            promise.resolve(null);
        } else {
            int code = getExceptionCode(task);
            promise.reject(String.valueOf(code), GoogleSignInStatusCodes.getStatusCodeString(code));
        }
    }

    private boolean addUIThreadRunnableOrReject(Runnable runnable, Promise promise) {
        UIManager manager = mModuleRegistry.getModule(UIManager.class);
        if (manager == null) {
            promise.reject(new IllegalStateException("Implementation of " + UIManager.class.getName() + " is null. Are you sure you've included a proper Expo adapter for your platform?"));
            return false;
        } else {
            manager.runOnUiQueueThread(runnable);
            return true;
        }
    }

    private GoogleSignInClient getClientOrReject(Promise promise) {
        if (_apiClient == null) {
            promise.reject(ERROR_EXCEPTION, "apiClient is null - call configure first");
        }
        return _apiClient;
    }

    private static class AccessTokenRetrievalTask extends AsyncTask<Bundle, Void, Bundle> {

        private WeakReference<GoogleSignInModule> weakModuleRef;

        AccessTokenRetrievalTask(GoogleSignInModule module) {
            this.weakModuleRef = new WeakReference<>(module);
        }

        @Override
        protected Bundle doInBackground(Bundle... params) {
            Bundle user = params[0];
            String mail = user.getString("email");
            GoogleSignInModule moduleInstance = weakModuleRef.get();
            if (moduleInstance == null) {
                return user;
            }
            try {
                ArrayList<String> scopes = user.getStringArrayList("scopes");
                String token = GoogleAuthUtil.getToken(moduleInstance.getApplicationContext(), new Account(mail, "com.google"), scopesToString(scopes));
                Bundle auth = user.getBundle("auth");
                auth.putString("accessToken", token);
                user.putBundle("auth", auth);
                return user;
            } catch (Exception e) {
                moduleInstance.authTask.reject(ERROR_EXCEPTION, e.getLocalizedMessage());
                return null;
            }
        }

        @Override
        protected void onPostExecute(Bundle result) {
            super.onPostExecute(result);
            GoogleSignInModule moduleInstance = weakModuleRef.get();
            if (moduleInstance != null && result != null) {
                moduleInstance.authTask.resolve(result);
            }
        }
    }

    private class GoogleSignInActivityEventListener implements ActivityEventListener {
        @Override
        public void onActivityResult(Activity activity, final int requestCode, final int resultCode, final Intent intent) {
            if (requestCode == RC_LOG_IN) {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(intent);
                handleSignInTaskResult(task);
            }
        }

        @Override
        public void onNewIntent(Intent intent) {
            // do nothing
        }
    }
}
