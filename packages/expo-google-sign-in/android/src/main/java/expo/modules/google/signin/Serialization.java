package expo.modules.google.signin;


import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import androidx.annotation.NonNull;

import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.Task;

import java.util.ArrayList;
import java.util.Map;

import org.unimodules.core.Promise;

public class Serialization {

    private Bundle auth;

    static String scopesToString(ArrayList<String> scopes) {
        StringBuilder sb = new StringBuilder("oauth2:");
        for (int i = 0; i < scopes.size(); i++) {
            sb.append(scopes.get(i)).append(" ");
        }
        return sb.toString().trim();
    }

    static Bundle jsonFromGoogleUser(@NonNull GoogleSignInAccount acct) {

        Bundle auth = new Bundle();
        auth.putString("accessToken", null);
        auth.putString("accessTokenExpirationDate", null);
        auth.putString("refreshToken", null);
        auth.putString("idToken", acct.getIdToken());
//        auth.putDouble("idTokenExpirationDate", acct.getExpirationTimeSecs());

        Uri photoUrl = acct.getPhotoUrl();
        Bundle user = new Bundle();
        user.putString("uid", acct.getId());
        user.putString("displayName", acct.getDisplayName());
        user.putString("firstName", acct.getGivenName());
        user.putString("lastName", acct.getFamilyName());
        user.putString("email", acct.getEmail());
        user.putString("photoURL", photoUrl != null ? photoUrl.toString() : null);
        user.putString("serverAuthCode", acct.getServerAuthCode());
        user.putBundle("auth", auth);
         // TODO: Bacon: If google ever surfaces this value, we should add it for parity with iOS
        user.putString("domain", null);

        ArrayList scopes = new ArrayList();
        for (Scope scope : acct.getGrantedScopes()) {
            String scopeString = scope.toString();
            if (scopeString.startsWith("http")) {
                scopes.add(scopeString);
            }
        }
        user.putStringArrayList("scopes", scopes);
        return user;
    }

    private static Boolean isNullOrEmpty(String s) {
        return (s == null || s.isEmpty());
    }

    static GoogleSignInOptions getSignInOptions(
            final Context context,
            final Map<String, Object> config,
            final String appOwnership,
            final Promise promise
    ) {

        String signInOption = config.containsKey("signInType") ? (String) config.get("signInType") : "default";
        ArrayList<String> scopes = config.containsKey("scopes") ? (ArrayList) config.get("scopes") : new ArrayList();
        String webClientId = config.containsKey("webClientId") ? (String) config.get("webClientId") : null;
        boolean isOfflineEnabled = config.containsKey("isOfflineEnabled") && (boolean) config.get("isOfflineEnabled");
        boolean isPromptEnabled = config.containsKey("isPromptEnabled") && (boolean) config.get("isPromptEnabled");
        String accountName = config.containsKey("accountName") ? (String) config.get("accountName") : null;
        String hostedDomain = config.containsKey("hostedDomain") ? (String) config.get("hostedDomain") : null;

        GoogleSignInOptions.Builder optionsBuilder;

        switch (signInOption) {

            case "default":
                optionsBuilder =
                        new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestEmail().requestProfile();
                break;
            case "games":
                optionsBuilder =
                        new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_GAMES_SIGN_IN);
                break;
            // TODO: Bacon: Add fitness
//            case "fitness":
//                optionsBuilder =
//                        new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN);
//                optionsBuilder.addExtension(GoogleSignInOptionsExtension.FITNESS);
//                break;
            default:
                promise.reject("E_GOOGLE_SIGN_IN", "Invalid signInOption");
                return null;
        }

        if (webClientId == null && appOwnership.equals("standalone")) {
            int clientIdIdentifier =
                    context
                            .getResources()
                            .getIdentifier(
                                    "default_web_client_id", "string", context.getPackageName());
            if (clientIdIdentifier != 0) {
                optionsBuilder.requestIdToken(context.getString(clientIdIdentifier));
            }
        } else if (!isNullOrEmpty(webClientId)) {
            optionsBuilder.requestIdToken(webClientId);
            if (isOfflineEnabled) {
                optionsBuilder.requestServerAuthCode(webClientId, isPromptEnabled);
            }
        }

        for (String scope : scopes) {
            optionsBuilder.requestScopes(new Scope(scope));
        }
        if (!isNullOrEmpty(hostedDomain)) {
            optionsBuilder.setHostedDomain(hostedDomain);
        }
        if (!isNullOrEmpty(accountName)) {
            optionsBuilder.setAccountName(accountName);
        }

        return optionsBuilder.build();
    }

    public static int getExceptionCode(@NonNull Task<Void> task) {
        Exception e = task.getException();

        if (e instanceof ApiException) {
            ApiException exception = (ApiException) e;
            return exception.getStatusCode();
        }
        return CommonStatusCodes.INTERNAL_ERROR;
    }
}
