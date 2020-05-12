package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.core.arguments.ReadableArguments;

import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.scheduling.NotificationScheduler;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationScheduler extends NotificationScheduler {
  static String EXPERIENCE_ID_KEY = "experienceId";
  static String USER_DATA_KEY = "userData";

  private ExperienceId mExperienceId;

  public ScopedNotificationScheduler(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  protected NotificationContent createNotificationContent(ReadableArguments notificationContentMap) {
    return new ScopedArgumentsNotificationContentBuilder(getContext(), mExperienceId).setPayload(notificationContentMap).build();
  }

  static class ScopedArgumentsNotificationContentBuilder extends ArgumentsNotificationContentBuilder {
    private ExperienceId mExperienceId;

    ScopedArgumentsNotificationContentBuilder(Context context, ExperienceId experienceId) {
      super(context);
      mExperienceId = experienceId;
    }

    @Override
    public NotificationContent.Builder setBody(JSONObject body) {
      JSONObject expoBody = new JSONObject();
      try {
        expoBody.put(EXPERIENCE_ID_KEY, mExperienceId.get());
        expoBody.put(USER_DATA_KEY, body);
      } catch (JSONException e) {
        Log.w("NotificationScheduler", "Couldn't add expo related data to notification's body.", e);
      }
      super.setBody(expoBody);
      return this;
    }
  }
}
