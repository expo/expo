package expo.modules.updates;

import org.json.JSONException;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

import static expo.modules.updates.UpdatesUtils.getMapFromStringifiedJSON;
import static org.hamcrest.CoreMatchers.is;

@RunWith(AndroidJUnit4ClassRunner.class)
public class UpdatesUtilsInstrumentationTest {
  @Test
  public void testParseDateString_Z() throws ParseException {
    Assert.assertEquals(new Date(1605053874699L), UpdatesUtils.parseDateString("2020-11-11T00:17:54.699Z"));
  }

  @Test
  public void testParseDateString_writtenTimezone() throws ParseException {
    Assert.assertEquals(new Date(1605053874699L), UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+0000"));
    Assert.assertEquals(new Date(1605050274699L), UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+0100"));
  }

  @Test
  public void testParseDateString_writtenTimezoneWithColon() throws ParseException {
    Assert.assertEquals(new Date(1605053874699L), UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+00:00"));
    Assert.assertEquals(new Date(1605050274699L), UpdatesUtils.parseDateString("2020-11-11T00:17:54.699+01:00"));
  }

  @Test
  public void testGetMapFromStringifiedJSON_empty() throws Exception {
    Map<String,String> emptyMap = getMapFromStringifiedJSON("{}");
    Assert.assertThat(emptyMap, is(new HashMap<>()));
  }

  @Test
  public void testGetMapFromStringifiedJSON_expectedFormat() throws Exception {
    Map<String, String> expected = new HashMap<>();
    expected.put("expo-channel-name","main");

    Map<String,String> emptyMap = getMapFromStringifiedJSON("{'expo-channel-name':'main'}");
    Assert.assertThat(emptyMap, is(expected));
  }

  @Test(expected = Exception.class)
  public void testGetMapFromStringifiedJSON_throwsIntegerValue() throws Exception {
    getMapFromStringifiedJSON("{'expo-channel-name': 5}");
  }

  @Test(expected = Exception.class)
  public void testGetMapFromStringifiedJSON_throwsNonStringValue() throws Exception {
    getMapFromStringifiedJSON("{'expo-channel-name':['main']}");
  }

  @Test(expected = Exception.class)
  public void testGetMapFromStringifiedJSON_throwsNonStringKey() throws Exception {
    getMapFromStringifiedJSON("{7:['main']}");
  }
}
