package expo.modules.updates;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.text.ParseException;
import java.util.Date;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

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
}
