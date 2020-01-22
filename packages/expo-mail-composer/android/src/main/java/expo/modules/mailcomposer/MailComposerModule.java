package expo.modules.mailcomposer;

import android.app.Application;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.LabeledIntent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.content.FileProvider;
import android.text.Html;
import android.text.Spanned;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.services.UIManager;

public class MailComposerModule extends ExportedModule implements LifecycleEventListener {
  private boolean mComposerOpened = false;
  private ModuleRegistry mModuleRegistry;
  private Promise mPromise;

  public MailComposerModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoMailComposer";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    if (mModuleRegistry != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }
    mModuleRegistry = moduleRegistry;
    if (mModuleRegistry != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  @ExpoMethod
  public void isAvailableAsync(final Promise promise) {
    promise.resolve(true);
  }

  @ExpoMethod
  public void composeAsync(ReadableArguments options, Promise promise) {

    Intent intent = new Intent(Intent.ACTION_SENDTO);
    intent.setData(Uri.parse("mailto:"));

    String[] recipients = {}, ccRecipients = {}, bccRecipients = {};
    String subject = "";
    String body = "";
    Spanned htmlBody = null;
    ArrayList<Uri> attachments = new ArrayList<>();

    if (options.containsKey("recipients")) {
      recipients = getStringArrayFrom(options, "recipients");
    }

    if (options.containsKey("ccRecipients")) {
      ccRecipients = getStringArrayFrom(options, "ccRecipients");
    }

    if (options.containsKey("bccRecipients")) {
      bccRecipients = getStringArrayFrom(options, "bccRecipients");
    }

    if (options.containsKey("subject")) {
      subject = options.getString("subject");
    }

    boolean isHtml = options.containsKey("isHtml") && options.getBoolean("isHtml");
    if (options.containsKey("body")) {
      if (isHtml) {
        htmlBody = Html.fromHtml(options.getString("body"));
      } else {
        body = options.getString("body");
      }
    }

    if (options.containsKey("attachments")) {
      String[] requestedAttachments = getStringArrayFrom(options, "attachments");
      for (String requestedAttachment : requestedAttachments) {
        File attachmentFile = new File(Uri.parse(requestedAttachment).getPath());
        attachments.add(contentUriFromFile(attachmentFile));
      }
    }

    List<ResolveInfo> resolveInfos = getContext().getPackageManager().queryIntentActivities(intent, 0);
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
      mailIntents.add(new LabeledIntent(mailIntent, info.activityInfo.packageName, info.loadLabel(getContext().getPackageManager()), info.icon));
    }
    Intent chooser = Intent.createChooser(mailIntents.remove(mailIntents.size() - 1), null);
    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, mailIntents.toArray(new LabeledIntent[mailIntents.size()]));

    mPromise = promise;
    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    getContext().startActivity(chooser);
    mComposerOpened = true;
  }

  @Override
  public void onHostResume() {
    if (mComposerOpened) {
      mComposerOpened = false;
      Bundle response = new Bundle();
      response.putString("status", "sent");
      mPromise.resolve(response);
    }
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }

  private String[] getStringArrayFrom(ReadableArguments arguments, String key) {
    return ((List<String>) arguments.getList(key)).toArray(new String[0]);
  }

  private Uri contentUriFromFile(File file) {
    try {
      Application application = mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity().getApplication();
      return FileProvider.getUriForFile(application, application.getPackageName() + ".provider", file);
    } catch (Exception e) {
      return Uri.fromFile(file);
    }
  }
}
