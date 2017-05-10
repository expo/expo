// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

public class ExperienceId {

  private static final Map<String, ExperienceId> sMap = new HashMap<>();
  private String mId;

  public static ExperienceId create(final String id) {
    if (!sMap.containsKey(id)) {
      sMap.put(id, new ExperienceId(id));
    }

    return sMap.get(id);
  }

  private ExperienceId(final String id) {
    mId = id;
  }

  public String get() {
    return mId;
  }

  public String getUrlEncoded() throws UnsupportedEncodingException {
    return URLEncoder.encode(mId, "UTF-8");
  }

  @Override
  public boolean equals(Object obj) {
    if (obj == null) {
      return false;
    }

    if (!(obj instanceof ExperienceId)) {
      return false;
    }

    final ExperienceId other = (ExperienceId) obj;
    if (mId != other.mId) {
      return false;
    }

    return true;
  }

  @Override
  public int hashCode() {
    return mId.hashCode();
  }
}
