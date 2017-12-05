package abi21_0_0.host.exp.exponent.modules.api.standalone.branch;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;
import android.os.Handler;

import abi21_0_0.com.facebook.react.bridge.*;
import abi21_0_0.com.facebook.react.bridge.Promise;
import abi21_0_0.com.facebook.react.modules.core.*;
import abi21_0_0.com.facebook.react.bridge.ReadableMap;

import io.branch.referral.*;
import io.branch.referral.Branch.BranchLinkCreateListener;
import io.branch.referral.util.*;
import io.branch.referral.Branch;
import io.branch.indexing.*;

import org.json.*;

import java.lang.ref.WeakReference;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

public class RNBranchModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "RNBranch";
    public static final String REACT_MODULE_NAME = "RNBranch";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT = "io.branch.rnbranch.RNBranchModule.onInitSessionFinished";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT_BRANCH_UNIVERSAL_OBJECT = "branch_universal_object";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT_LINK_PROPERTIES = "link_properties";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT_PARAMS = "params";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT_ERROR = "error";
    public static final String NATIVE_INIT_SESSION_FINISHED_EVENT_URI = "uri";
    private static final String RN_INIT_SESSION_SUCCESS_EVENT = "RNBranch.initSessionSuccess";
    private static final String RN_INIT_SESSION_ERROR_EVENT = "RNBranch.initSessionError";
    private static final String INIT_SESSION_SUCCESS = "INIT_SESSION_SUCCESS";
    private static final String INIT_SESSION_ERROR = "INIT_SESSION_ERROR";
    private static final String ADD_TO_CART_EVENT = "ADD_TO_CART_EVENT";
    private static final String ADD_TO_WISHLIST_EVENT = "ADD_TO_WISHLIST_EVENT";
    private static final String PURCHASED_EVENT = "PURCHASED_EVENT";
    private static final String PURCHASE_INITIATED_EVENT = "PURCHASE_INITIATED_EVENT";
    private static final String REGISTER_VIEW_EVENT = "REGISTER_VIEW_EVENT";
    private static final String SHARE_COMPLETED_EVENT = "SHARE_COMPLETED_EVENT";
    private static final String SHARE_INITIATED_EVENT = "SHARE_INITIATED_EVENT";
    private static final String IDENT_FIELD_NAME = "ident";
    public static final String UNIVERSAL_OBJECT_NOT_FOUND_ERROR_CODE = "RNBranch::Error::BUONotFound";
    private static final long AGING_HASH_TTL = 3600000;

    private static JSONObject initSessionResult = null;
    private BroadcastReceiver mInitSessionEventReceiver = null;
    private static WeakReference<Branch.BranchUniversalReferralInitListener> initListener = null;

    private static Activity mActivity = null;
    private static Branch mBranch = null;

    private AgingHash<String, BranchUniversalObject> mUniversalObjectMap = new AgingHash<>(AGING_HASH_TTL);

    public static void initSession(final Uri uri, Activity reactActivity, Branch.BranchUniversalReferralInitListener anInitListener) {
        initListener = new WeakReference<>(anInitListener);
        initSession(uri, reactActivity);
    }

    public static void initSession(final Uri uri, Activity reactActivity) {
        mBranch = Branch.getInstance(reactActivity.getApplicationContext());
        mActivity = reactActivity;
        mBranch.initSession(new Branch.BranchReferralInitListener(){

            private Activity mmActivity = null;

            @Override
            public void onInitFinished(JSONObject referringParams, BranchError error) {

                Log.d(REACT_CLASS, "onInitFinished");
                JSONObject result = new JSONObject();
                try{
                    result.put(NATIVE_INIT_SESSION_FINISHED_EVENT_PARAMS, referringParams != null && referringParams.has("~id") ? referringParams : JSONObject.NULL);
                    result.put(NATIVE_INIT_SESSION_FINISHED_EVENT_ERROR, error != null ? error.getMessage() : JSONObject.NULL);
                    result.put(NATIVE_INIT_SESSION_FINISHED_EVENT_URI, uri != null ? uri.toString() : JSONObject.NULL);
                } catch(JSONException ex) {
                    try {
                        result.put("error", "Failed to convert result to JSONObject: " + ex.getMessage());
                    } catch(JSONException k) {}
                }
                initSessionResult = result;

                BranchUniversalObject branchUniversalObject =  BranchUniversalObject.getReferredBranchUniversalObject();
                LinkProperties linkProperties = LinkProperties.getReferredLinkProperties();

                if (initListener != null) {
                    Branch.BranchUniversalReferralInitListener listener = initListener.get();
                    if (listener != null) listener.onInitFinished(branchUniversalObject, linkProperties, error);
                }
                generateLocalBroadcast(referringParams, uri, branchUniversalObject, linkProperties, error);
            }

            private Branch.BranchReferralInitListener init(Activity activity) {
                mmActivity = activity;
                return this;
            }

            private void generateLocalBroadcast(JSONObject referringParams,
                                                Uri uri,
                                                BranchUniversalObject branchUniversalObject,
                                                LinkProperties linkProperties,
                                                BranchError error) {
                Intent broadcastIntent = new Intent(NATIVE_INIT_SESSION_FINISHED_EVENT);

                if (referringParams != null) {
                    broadcastIntent.putExtra(NATIVE_INIT_SESSION_FINISHED_EVENT_PARAMS, referringParams.toString());
                }

                if (branchUniversalObject != null) {
                    broadcastIntent.putExtra(NATIVE_INIT_SESSION_FINISHED_EVENT_BRANCH_UNIVERSAL_OBJECT, branchUniversalObject);
                }

                if (linkProperties != null) {
                    broadcastIntent.putExtra(NATIVE_INIT_SESSION_FINISHED_EVENT_LINK_PROPERTIES, linkProperties);
                }

                if (uri != null) {
                    broadcastIntent.putExtra(NATIVE_INIT_SESSION_FINISHED_EVENT_URI, uri.toString());
                }

                if (error != null) {
                    broadcastIntent.putExtra(NATIVE_INIT_SESSION_FINISHED_EVENT_ERROR, error.getMessage());
                }

                LocalBroadcastManager.getInstance(mmActivity).sendBroadcast(broadcastIntent);
            }
        }.init(reactActivity), uri, reactActivity);
    }

    public RNBranchModule(ReactApplicationContext reactContext) {
        super(reactContext);
        forwardInitSessionFinishedEventToReactNative(reactContext);
    }

    @javax.annotation.Nullable
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        // RN events transmitted to JS
        constants.put(INIT_SESSION_SUCCESS, RN_INIT_SESSION_SUCCESS_EVENT);
        constants.put(INIT_SESSION_ERROR, RN_INIT_SESSION_ERROR_EVENT);
        // Constants for use with userCompletedAction
        constants.put(ADD_TO_CART_EVENT, BranchEvent.ADD_TO_CART);
        constants.put(ADD_TO_WISHLIST_EVENT, BranchEvent.ADD_TO_WISH_LIST);
        constants.put(PURCHASED_EVENT, BranchEvent.PURCHASED);
        constants.put(PURCHASE_INITIATED_EVENT, BranchEvent.PURCHASE_STARTED);
        constants.put(REGISTER_VIEW_EVENT, BranchEvent.VIEW);
        constants.put(SHARE_COMPLETED_EVENT, BranchEvent.SHARE_COMPLETED);
        constants.put(SHARE_INITIATED_EVENT, BranchEvent.SHARE_STARTED);
        return constants;
    }

    private void forwardInitSessionFinishedEventToReactNative(ReactApplicationContext reactContext) {
        mInitSessionEventReceiver = new BroadcastReceiver() {
            RNBranchModule mBranchModule;

            @Override
            public void onReceive(Context context, Intent intent) {
                final String eventName = initSessionResult.has("error") ? RN_INIT_SESSION_ERROR_EVENT : RN_INIT_SESSION_SUCCESS_EVENT;
                mBranchModule.sendRNEvent(eventName, convertJsonToMap(initSessionResult));
            }

            private BroadcastReceiver init(RNBranchModule branchModule) {
                mBranchModule = branchModule;
                return this;
            }
        }.init(this);

        LocalBroadcastManager.getInstance(reactContext).registerReceiver(mInitSessionEventReceiver, new IntentFilter(NATIVE_INIT_SESSION_FINISHED_EVENT));
    }

    @Override
    public void onCatalystInstanceDestroy() {
        LocalBroadcastManager.getInstance(getReactApplicationContext()).unregisterReceiver(mInitSessionEventReceiver);
    }

    @Override
    public String getName() {
        return REACT_MODULE_NAME;
    }

    @ReactMethod
    public void createUniversalObject(ReadableMap universalObjectMap, Promise promise) {
        String ident = UUID.randomUUID().toString();
        BranchUniversalObject universalObject = createBranchUniversalObject(universalObjectMap);
        mUniversalObjectMap.put(ident, universalObject);

        WritableMap response = new WritableNativeMap();
        response.putString(IDENT_FIELD_NAME, ident);
        promise.resolve(response);
    }

    @ReactMethod
    public void releaseUniversalObject(String ident) {
        mUniversalObjectMap.remove(ident);
    }

    @ReactMethod
    public void redeemInitSessionResult(Promise promise) {
        promise.resolve(convertJsonToMap(initSessionResult));
    }

    @ReactMethod
    public void setDebug() {
        Branch branch = Branch.getInstance();
        branch.setDebug();
    }

    @ReactMethod
    public void getLatestReferringParams(Promise promise) {
        Branch branch = Branch.getInstance();
        promise.resolve(convertJsonToMap(branch.getLatestReferringParams()));
    }

    @ReactMethod
    public void getFirstReferringParams(Promise promise) {
        Branch branch = Branch.getInstance();
        promise.resolve(convertJsonToMap(branch.getFirstReferringParams()));
    }

    @ReactMethod
    public void setIdentity(String identity) {
        Branch branch = Branch.getInstance();
        branch.setIdentity(identity);
    }

    @ReactMethod
    public void logout() {
        Branch branch = Branch.getInstance();
        branch.logout();
    }

    @ReactMethod
    public void userCompletedAction(String event, ReadableMap appState) throws JSONException {
        Branch branch = Branch.getInstance();
        branch.userCompletedAction(event, convertMapToJson(appState));
    }

    @ReactMethod
    public void userCompletedActionOnUniversalObject(String ident, String event, ReadableMap state, Promise promise) {
        BranchUniversalObject universalObject = findUniversalObjectOrReject(ident, promise);
        if (universalObject == null) return;

        universalObject.userCompletedAction(event, convertMapToParams(state));
        promise.resolve(null);
    }

    @ReactMethod
    public void showShareSheet(String ident, ReadableMap shareOptionsMap, ReadableMap linkPropertiesMap, ReadableMap controlParamsMap, Promise promise) {
        Context context = getReactApplicationContext();

        Handler mainHandler = new Handler(context.getMainLooper());

        Runnable myRunnable = new Runnable() {
            Promise mPm;
            Context mContext;
            ReadableMap shareOptionsMap, linkPropertiesMap, controlParamsMap;
            String ident;

            private Runnable init(ReadableMap _shareOptionsMap, String _ident, ReadableMap _linkPropertiesMap, ReadableMap _controlParamsMap, Promise promise, Context context) {
                mPm = promise;
                mContext = context;
                shareOptionsMap = _shareOptionsMap;
                ident = _ident;
                linkPropertiesMap = _linkPropertiesMap;
                controlParamsMap = _controlParamsMap;
                return this;
            }

            @Override
            public void run() {
                String messageHeader = shareOptionsMap.hasKey("messageHeader") ? shareOptionsMap.getString("messageHeader") : "";
                String messageBody = shareOptionsMap.hasKey("messageBody") ? shareOptionsMap.getString("messageBody") : "";
                ShareSheetStyle shareSheetStyle = new ShareSheetStyle(mContext, messageHeader, messageBody)
                        .setCopyUrlStyle(mContext.getResources().getDrawable(android.R.drawable.ic_menu_send), "Copy", "Added to clipboard")
                        .setMoreOptionStyle(mContext.getResources().getDrawable(android.R.drawable.ic_menu_search), "Show more")
                        .addPreferredSharingOption(SharingHelper.SHARE_WITH.EMAIL)
                        .addPreferredSharingOption(SharingHelper.SHARE_WITH.TWITTER)
                        .addPreferredSharingOption(SharingHelper.SHARE_WITH.MESSAGE)
                        .addPreferredSharingOption(SharingHelper.SHARE_WITH.FACEBOOK);

                BranchUniversalObject branchUniversalObject = findUniversalObjectOrReject(ident, mPm);
                if (branchUniversalObject == null) {
                    return;
                }

                LinkProperties linkProperties = createLinkProperties(linkPropertiesMap, controlParamsMap);

                branchUniversalObject.showShareSheet(
                        getCurrentActivity(),
                        linkProperties,
                        shareSheetStyle,
                        new Branch.BranchLinkShareListener() {
                            private Promise mPromise = null;

                            @Override
                            public void onShareLinkDialogLaunched() {
                            }

                            @Override
                            public void onShareLinkDialogDismissed() {
                                if(mPromise == null) {
                                    return;
                                }

                                WritableMap map = new WritableNativeMap();
                                map.putString("channel", null);
                                map.putBoolean("completed", false);
                                map.putString("error", null);
                                mPromise.resolve(map);
                                mPromise = null;
                            }

                            @Override
                            public void onLinkShareResponse(String sharedLink, String sharedChannel, BranchError error) {
                                if(mPromise == null) {
                                    return;
                                }

                                WritableMap map = new WritableNativeMap();
                                map.putString("channel", sharedChannel);
                                map.putBoolean("completed", true);
                                map.putString("error", (error != null ? error.getMessage() : null));
                                mPromise.resolve(map);
                                mPromise = null;
                            }
                            @Override
                            public void onChannelSelected(String channelName) {
                            }

                            private Branch.BranchLinkShareListener init(Promise promise) {
                                mPromise = promise;
                                return this;
                            }
                        }.init(mPm));
            }
        }.init(shareOptionsMap, ident, linkPropertiesMap, controlParamsMap, promise, context);

        mainHandler.post(myRunnable);
    }

    @ReactMethod
    public void registerView(String ident, Promise promise) {
        BranchUniversalObject branchUniversalObject = findUniversalObjectOrReject(ident, promise);
        if (branchUniversalObject == null) {
             return;
        }

        branchUniversalObject.registerView();
        promise.resolve(null);
    }

    @ReactMethod
    public void generateShortUrl(String ident, ReadableMap linkPropertiesMap, ReadableMap controlParamsMap, final Promise promise) {
        LinkProperties linkProperties = createLinkProperties(linkPropertiesMap, controlParamsMap);

        BranchUniversalObject branchUniversalObject = findUniversalObjectOrReject(ident, promise);
        if (branchUniversalObject == null) {
            return;
        }

        branchUniversalObject.generateShortUrl(mActivity, linkProperties, new BranchLinkCreateListener() {
            @Override
            public void onLinkCreate(String url, BranchError error) {
                Log.d(REACT_CLASS, "onLinkCreate " + url);
                WritableMap map = new WritableNativeMap();
                map.putString("url", url);
                if (error != null) {
                    map.putString("error", error.toString());
                }
                promise.resolve(map);
            }
        });
    }

    public static LinkProperties createLinkProperties(ReadableMap linkPropertiesMap, @Nullable ReadableMap controlParams){
        LinkProperties linkProperties = new LinkProperties();
        if (linkPropertiesMap.hasKey("alias")) linkProperties.setAlias(linkPropertiesMap.getString("alias"));
        if (linkPropertiesMap.hasKey("campaign")) linkProperties.setCampaign(linkPropertiesMap.getString("campaign"));
        if (linkPropertiesMap.hasKey("channel")) linkProperties.setChannel(linkPropertiesMap.getString("channel"));
        if (linkPropertiesMap.hasKey("feature")) linkProperties.setFeature(linkPropertiesMap.getString("feature"));
        if (linkPropertiesMap.hasKey("stage")) linkProperties.setStage(linkPropertiesMap.getString("stage"));

        if (linkPropertiesMap.hasKey("tags")) {
            ReadableArray tags = linkPropertiesMap.getArray("tags");
            for (int i=0; i<tags.size(); ++i) {
                String tag = tags.getString(i);
                linkProperties.addTag(tag);
            }
        }

        if (controlParams != null) {
            ReadableMapKeySetIterator iterator = controlParams.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                Object value = getReadableMapObjectForKey(controlParams, key);
                linkProperties.addControlParameter(key, value.toString());
            }
        }

        return linkProperties;
    }

    private BranchUniversalObject findUniversalObjectOrReject(final String ident, final Promise promise) {
        BranchUniversalObject universalObject = mUniversalObjectMap.get(ident);

        if (universalObject == null) {
            final String errorMessage = "BranchUniversalObject not found for ident " + ident + ".";
            promise.reject(UNIVERSAL_OBJECT_NOT_FOUND_ERROR_CODE, errorMessage);
        }

        return universalObject;
    }

    public BranchUniversalObject createBranchUniversalObject(ReadableMap branchUniversalObjectMap) {
        BranchUniversalObject branchUniversalObject = new BranchUniversalObject()
                .setCanonicalIdentifier(branchUniversalObjectMap.getString("canonicalIdentifier"));

        if (branchUniversalObjectMap.hasKey("title")) branchUniversalObject.setTitle(branchUniversalObjectMap.getString("title"));
        if (branchUniversalObjectMap.hasKey("canonicalUrl")) branchUniversalObject.setCanonicalUrl(branchUniversalObjectMap.getString("canonicalUrl"));
        if (branchUniversalObjectMap.hasKey("contentDescription")) branchUniversalObject.setContentDescription(branchUniversalObjectMap.getString("contentDescription"));
        if (branchUniversalObjectMap.hasKey("contentImageUrl")) branchUniversalObject.setContentImageUrl(branchUniversalObjectMap.getString("contentImageUrl"));
        if (branchUniversalObjectMap.hasKey("contentIndexingMode")) {
            switch (branchUniversalObjectMap.getType("contentIndexingMode")) {
                case String:
                    String mode = branchUniversalObjectMap.getString("contentIndexingMode");

                    if (mode.equals("private"))
                        branchUniversalObject.setContentIndexingMode(BranchUniversalObject.CONTENT_INDEX_MODE.PRIVATE);
                    else if (mode.equals("public"))
                        branchUniversalObject.setContentIndexingMode(BranchUniversalObject.CONTENT_INDEX_MODE.PUBLIC);
                    else
                        Log.w(REACT_CLASS, "Unsupported value for contentIndexingMode: " + mode +
                                ". Supported values are \"public\" and \"private\"");
                    break;
                default:
                    Log.w(REACT_CLASS, "contentIndexingMode must be a String");
                    break;
            }
        }

        if (branchUniversalObjectMap.hasKey("currency") && branchUniversalObjectMap.hasKey("price")) {
            String currencyString = branchUniversalObjectMap.getString("currency");
            CurrencyType currency = CurrencyType.valueOf(currencyString);
            branchUniversalObject.setPrice(branchUniversalObjectMap.getDouble("price"), currency);
        }

        if (branchUniversalObjectMap.hasKey("expirationDate")) {
            String expirationString = branchUniversalObjectMap.getString("expirationDate");
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
            format.setTimeZone(TimeZone.getTimeZone("UTC"));
            try {
                Date date = format.parse(expirationString);
                Log.d(REACT_CLASS, "Expiration date is " + date.toString());
                branchUniversalObject.setContentExpiration(date);
            }
            catch (ParseException e) {
                Log.w(REACT_CLASS, "Invalid expiration date format. Valid format is YYYY-mm-ddTHH:MM:SS, e.g. 2017-02-01T00:00:00. All times UTC.");
            }
        }

        if (branchUniversalObjectMap.hasKey("keywords")) {
            ReadableArray keywords = branchUniversalObjectMap.getArray("keywords");
            for (int i=0; i<keywords.size(); ++i) {
                branchUniversalObject.addKeyWord(keywords.getString(i));
            }
        }

        if(branchUniversalObjectMap.hasKey("metadata")) {
            ReadableMap metadataMap = branchUniversalObjectMap.getMap("metadata");
            ReadableMapKeySetIterator iterator = metadataMap.keySetIterator();
            while (iterator.hasNextKey()) {
                String metadataKey = iterator.nextKey();
                Object metadataObject = getReadableMapObjectForKey(metadataMap, metadataKey);
                branchUniversalObject.addContentMetadata(metadataKey, metadataObject.toString());
            }
        }

        if (branchUniversalObjectMap.hasKey("type")) branchUniversalObject.setContentType(branchUniversalObjectMap.getString("type"));

        return branchUniversalObject;
    }

    @ReactMethod
    public void redeemRewards(int value, String bucket, Promise promise)
    {
        if (bucket == null) {
            Branch.getInstance().redeemRewards(value, new RedeemRewardsListener(promise));
        } else {
            Branch.getInstance().redeemRewards(bucket, value, new RedeemRewardsListener(promise));
        }
    }

    @ReactMethod
    public void loadRewards(Promise promise)
    {
        Branch.getInstance().loadRewards(new LoadRewardsListener(promise));
    }

    @ReactMethod
    public void getCreditHistory(Promise promise)
    {
        Branch.getInstance().getCreditHistory(new CreditHistoryListener(promise));
    }

    protected class CreditHistoryListener implements Branch.BranchListResponseListener
    {
        private Promise _promise;

        // Constructor that takes in a required callbackContext object
        public CreditHistoryListener(Promise promise) {
            this._promise = promise;
        }

        // Listener that implements BranchListResponseListener for getCreditHistory()
        @Override
        public void onReceivingResponse(JSONArray list, BranchError error) {
            ArrayList<String> errors = new ArrayList<String>();
            if (error == null) {
                try {
                    ReadableArray result = convertJsonToArray(list);
                    this._promise.resolve(result);
                } catch (JSONException err) {
                    this._promise.reject(err.getMessage());
                }
            } else {
                String errorMessage = error.getMessage();
                Log.d(REACT_CLASS, errorMessage);
                this._promise.reject(errorMessage);
            }
        }
    }

    protected class RedeemRewardsListener implements Branch.BranchReferralStateChangedListener
    {
        private Promise _promise;

        public RedeemRewardsListener(Promise promise) {
            this._promise = promise;
        }

        @Override
        public void onStateChanged(boolean changed, BranchError error) {
            if (error == null) {
                WritableMap map = new WritableNativeMap();
                map.putBoolean("changed", changed);
                this._promise.resolve(map);
            } else {
                String errorMessage = error.getMessage();
                Log.d(REACT_CLASS, errorMessage);
                this._promise.reject(errorMessage);
            }
        }
    }

    protected class LoadRewardsListener implements Branch.BranchReferralStateChangedListener
    {
        private Promise _promise;

        public LoadRewardsListener(Promise promise) {
            this._promise = promise;
        }

        @Override
        public void onStateChanged(boolean changed, BranchError error) {
            if (error == null) {
                int credits = Branch.getInstance().getCredits();
                WritableMap map = new WritableNativeMap();
                map.putInt("credits", credits);
                this._promise.resolve(map);
            } else {
                String errorMessage = error.getMessage();
                Log.d(REACT_CLASS, errorMessage);
                this._promise.reject(errorMessage);
            }
        }
    }

    public void sendRNEvent(String eventName, @Nullable WritableMap params) {
        // This should avoid the crash in getJSModule() at startup
        // See also: https://github.com/walmartreact/react-native-orientation-listener/issues/8

        ReactApplicationContext context = getReactApplicationContext();
        Handler mainHandler = new Handler(context.getMainLooper());

        Runnable poller = new Runnable() {

            private Runnable init(ReactApplicationContext _context, Handler _mainHandler, String _eventName, WritableMap _params) {
                mMainHandler = _mainHandler;
                mEventName = _eventName;
                mContext = _context;
                mParams = _params;
                return this;
            }

            final int pollDelayInMs = 100;
            final int maxTries = 300;

            int tries = 1;
            String mEventName;
            WritableMap mParams;
            Handler mMainHandler;
            ReactApplicationContext mContext;

            @Override
            public void run() {
                try {
                    Log.d(REACT_CLASS, "Catalyst instance poller try " + Integer.toString(tries));
                    if (mContext.hasActiveCatalystInstance()) {
                        Log.d(REACT_CLASS, "Catalyst instance active");
                        mContext
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit(mEventName, mParams);
                    } else {
                        tries++;
                        if (tries <= maxTries) {
                            mMainHandler.postDelayed(this, pollDelayInMs);
                        } else {
                            Log.e(REACT_CLASS, "Could not get Catalyst instance");
                        }
                    }
                }
                catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }.init(context, mainHandler, eventName, params);

        Log.d(REACT_CLASS, "sendRNEvent");

        mainHandler.post(poller);
    }

    private static Object getReadableMapObjectForKey(ReadableMap readableMap, String key) {
        switch(readableMap.getType(key)) {
            case Null:
                return "Null";
            case Boolean:
                return readableMap.getBoolean(key);
            case Number:
                return readableMap.getDouble(key);
            case String:
                return readableMap.getString(key);
            default:
                return "Unsupported Type";
        }
    }

    private static JSONObject convertMapToJson(ReadableMap readableMap) throws JSONException {
        JSONObject object = new JSONObject();
        ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (readableMap.getType(key)) {
                case Null:
                    object.put(key, JSONObject.NULL);
                    break;
                case Boolean:
                    object.put(key, readableMap.getBoolean(key));
                    break;
                case Number:
                    object.put(key, readableMap.getDouble(key));
                    break;
                case String:
                    object.put(key, readableMap.getString(key));
                    break;
                case Map:
                    object.put(key, convertMapToJson(readableMap.getMap(key)));
                    break;
                case Array:
                    object.put(key, convertArrayToJson(readableMap.getArray(key)));
                    break;
            }
        }
        return object;
    }

    private static JSONArray convertArrayToJson(ReadableArray readableArray) throws JSONException {
        JSONArray array = new JSONArray();
        for (int i = 0; i < readableArray.size(); i++) {
            switch (readableArray.getType(i)) {
                case Null:
                    break;
                case Boolean:
                    array.put(readableArray.getBoolean(i));
                    break;
                case Number:
                    array.put(readableArray.getDouble(i));
                    break;
                case String:
                    array.put(readableArray.getString(i));
                    break;
                case Map:
                    array.put(convertMapToJson(readableArray.getMap(i)));
                    break;
                case Array:
                    array.put(convertArrayToJson(readableArray.getArray(i)));
                    break;
            }
        }
        return array;
    }

    private static WritableMap convertJsonToMap(JSONObject jsonObject) {
        if(jsonObject == null) {
            return null;
        }

        WritableMap map = new WritableNativeMap();

        try {
            Iterator<String> iterator = jsonObject.keys();
            while (iterator.hasNext()) {
                String key = iterator.next();
                Object value = jsonObject.get(key);
                if (value instanceof JSONObject) {
                    map.putMap(key, convertJsonToMap((JSONObject) value));
                } else if (value instanceof  JSONArray) {
                    map.putArray(key, convertJsonToArray((JSONArray) value));
                } else if (value instanceof  Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof  Integer) {
                    map.putInt(key, (Integer) value);
                } else if (value instanceof  Double) {
                    map.putDouble(key, (Double) value);
                } else if (value instanceof String)  {
                    map.putString(key, (String) value);
                } else if (value == null || value == JSONObject.NULL) {
                    map.putNull(key);
                } else {
                    map.putString(key, value.toString());
                }
            }
        } catch(JSONException ex) {
            map.putString("error", "Failed to convert JSONObject to WriteableMap: " + ex.getMessage());
        }

        return map;
    }

    private static WritableArray convertJsonToArray(JSONArray jsonArray) throws JSONException {
        WritableArray array = new WritableNativeArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);
            if (value instanceof JSONObject) {
                array.pushMap(convertJsonToMap((JSONObject) value));
            } else if (value instanceof  JSONArray) {
                array.pushArray(convertJsonToArray((JSONArray) value));
            } else if (value instanceof  Boolean) {
                array.pushBoolean((Boolean) value);
            } else if (value instanceof  Integer) {
                array.pushInt((Integer) value);
            } else if (value instanceof  Double) {
                array.pushDouble((Double) value);
            } else if (value instanceof String)  {
                array.pushString((String) value);
            } else {
                array.pushString(value.toString());
            }
        }
        return array;
    }

    // Convert an arbitrary ReadableMap to a string-string hash of custom params for userCompletedAction.
    private static HashMap<String, String> convertMapToParams(ReadableMap map) {
        if (map == null) return null;

        HashMap<String, String> hash = new HashMap<>();

        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (map.getType(key)) {
                case String:
                    hash.put(key, map.getString(key));
                case Boolean:
                    hash.put(key, "" + map.getBoolean(key));
                case Number:
                    hash.put(key, "" + map.getDouble(key));
                default:
                    Log.w(REACT_CLASS, "Unsupported data type in params, ignoring");
            }
        }

        return hash;
    }
}
