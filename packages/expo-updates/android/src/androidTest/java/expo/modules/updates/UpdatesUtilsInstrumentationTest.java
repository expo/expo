package expo.modules.updates;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

import static expo.modules.updates.UpdatesUtils.getHeadersMapFromJSONString;

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
  public void testgetHeadersMapFromJSONString_empty() throws Exception {
    Map<String,String> emptyMap = getHeadersMapFromJSONString("{}");
    Assert.assertEquals(emptyMap, new HashMap<>());
  }

  @Test
  public void testgetHeadersMapFromJSONString_expectedFormat() throws Exception {
    Map<String, String> expected = new HashMap<>();
    expected.put("expo-channel-name","main");

    Map<String,String> emptyMap = getHeadersMapFromJSONString("{\"expo-channel-name\":\"main\"}");
    Assert.assertEquals(emptyMap, expected);
  }

  @Test(expected = Exception.class)
  public void testgetHeadersMapFromJSONString_throwsIntegerValue() throws Exception {
    getHeadersMapFromJSONString("{\"expo-channel-name\": 5}");
  }

  @Test(expected = Exception.class)
  public void testgetHeadersMapFromJSONString_throwsNonStringValue() throws Exception {
    getHeadersMapFromJSONString("{\"expo-channel-name\":[\"main\"]}");
  }

  @Test(expected = Exception.class)
  public void testgetHeadersMapFromJSONString_throwsNonStringKey() throws Exception {
    getHeadersMapFromJSONString("{7:[\"main\"]}");
  }
}
