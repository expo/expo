package abi26_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.LabeledIntent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.text.Html;
import android.text.Spanned;

import abi26_0_0.com.facebook.react.bridge.Arguments;
import abi26_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi26_0_0.com.facebook.react.bridge.Promise;
import abi26_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi26_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi26_0_0.com.facebook.react.bridge.ReactMethod;
import abi26_0_0.com.facebook.react.bridge.ReadableArray;
import abi26_0_0.com.facebook.react.bridge.ReadableMap;
import abi26_0_0.com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.utils.ExpFileUtils;

public class MailComposerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private boolean mComposerOpened = false;
  private Promise mPromise;

  public MailComposerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    getReactApplicationContext().addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "ExponentMailComposer";
  }

  @ReactMethod
  public void composeAsync(ReadableMap options, Promise promise) {

    Intent intent = new Intent(Intent.ACTION_SENDTO);
    intent.setData(Uri.parse("mailto:"));

    String[] recipients = {}, ccRecipients = {}, bccRecipients = {};
    String subject = "";
    String body = "";
    Spanned htmlBody = null;
    ArrayList<Uri> attachments = new ArrayList<>();

    if (options.hasKey("recipients")) {
      recipients =  options.getArray("recipients").toArrayList().toArray(new String[0]);
    }

    if (options.hasKey("ccRecipients")) {
      ccRecipients = options.getArray("ccRecipients").toArrayList().toArray(new String[0]);
    }

    if (options.hasKey("bccRecipients")) {
      bccRecipients =  options.getArray("bccRecipients").toArrayList().toArray(new String[0]);
    }

    if (options.hasKey("subject")) {
      subject = options.getString("subject");
    }

    boolean isHtml = options.hasKey("isHtml") && options.getBoolean("isHtml");
    if (options.hasKey("body")) {
      if (isHtml) {
        htmlBody = Html.fromHtml(options.getString("body"));
      } else {
        body = options.getString("body");
      }
    }

    if (options.hasKey("attachments")) {
      ReadableArray requestedAttachments = options.getArray("attachments");
      for (int i = 0; i < requestedAttachments.size(); i++) {
        File attachmentFile = new File(Uri.parse(options.getArray("attachments").getString(i)).getPath());
        attachments.add(ExpFileUtils.contentUriFromFile(attachmentFile));
      }
    }

    List<ResolveInfo> resolveInfos = getReactApplicationContext().getPackageManager().queryIntentActivities(intent, 0);
    List<LabeledIntent> mailIntents = new ArrayList<>();
    for (ResolveInfo info : resolveInfos) {
      Intent mailIntent = new Intent(Intent.ACTION_SEND_MULTIPLE);
      mailIntent.setComponent(new ComponentName(info.activityInfo.packageName, info.activityInfo.name));
      mailIntent.putExtra(Intent.EXTRA_EMAIL, recipients);
      mailIntent.putExtra(Intent.EXTRA_CC, ccRecipients);
      mailIntent.putExtra(Intent.EXTRA_BCC, bccRecipients);
      mailIntent.putExtra(Intent.EXTRA_SUBJECT, subject);
      mailIntent.putExtra(Intent.EXTRA_TEXT, isHtml ? htmlBody : body);
      mailIntent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, attachments);
      mailIntents.add(new LabeledIntent(mailIntent, info.activityInfo.packageName, info.loadLabel(getReactApplicationContext().getPackageManager()), info.icon));
    }
    Intent chooser = Intent.createChooser(mailIntents.remove(mailIntents.size() - 1), null);
    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, mailIntents.toArray(new LabeledIntent[mailIntents.size()]));

    mPromise = promise;
    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    getReactApplicationContext().startActivity(chooser);
    mComposerOpened = true;
  }

  @Override
  public void onHostResume() {
    if (mComposerOpened) {
      mComposerOpened = false;
      WritableMap response = Arguments.createMap();
      response.putString("status", "sent");
      mPromise.resolve(response);
    }
  }

  @Override
  public void onHostPause() {

  }

  @Override
  public void onHostDestroy() {

  }
}
