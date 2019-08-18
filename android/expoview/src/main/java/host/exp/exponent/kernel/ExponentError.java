// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import android.os.Bundle;
import android.provider.CalendarContract;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Date;

public class ExponentError {
  public final ExponentErrorMessage errorMessage;
  public final Bundle[] stack;
  public final int exceptionId;
  public final boolean isFatal;
  public final Date timestamp;

  public ExponentError(ExponentErrorMessage errorMessage, Bundle[] stack, int exceptionId, boolean isFatal) {
    this.errorMessage = errorMessage;
    this.stack = stack;
    this.exceptionId = exceptionId;
    this.isFatal = isFatal;
    this.timestamp = Calendar.getInstance().getTime();
  }

  public JSONObject toJSONObject() {
    try {
      JSONObject object = new JSONObject();
      object.put("errorMessage", errorMessage.developerErrorMessage());
      object.put("exceptionId", exceptionId);
      object.put("isFatal", isFatal);
      return object;
    } catch (JSONException e) {
      return null;
    }
  }
}
