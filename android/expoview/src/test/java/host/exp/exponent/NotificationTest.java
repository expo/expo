package host.exp.exponent;

import com.cronutils.model.Cron;
import com.cronutils.model.time.ExecutionTime;

import org.joda.time.DateTime;
import org.junit.Test;

import java.util.HashMap;

import static org.junit.Assert.assertEquals;
import static host.exp.exponent.notifications.helpers.ExpoCronParser.createCronInstance;

public class NotificationTest {
  @Test
  public void calendarNextExecutionTestOne() {
    HashMap<String, Object> data = new HashMap<String, Object>() {{
      put("day", 10);
      put("month", 12);
      put("year", 2020);
    }};

    Cron cron = createCronInstance(data);
    DateTime testDate = new DateTime(2019, 1, 1, 10, 10, 0);
    DateTime dateTime = ExecutionTime.forCron(cron).nextExecution(testDate);
    assertEquals(new DateTime(2020, 12, 10, 0, 0, 0), dateTime);
  }

  @Test
  public void calendarNextExecutionTestTwo() {
    HashMap<String, Object> data = new HashMap<String, Object>() {{
      put("weekDay", 6); // sun-sat
      put("month", 5);
      put("hour", 8);
      put("second", 0);
      put("minute", 0);
    }};

    Cron cron = createCronInstance(data);
    DateTime testDate = new DateTime(2019, 5, 16, 8, 1, 0);
    DateTime dateTime = ExecutionTime.forCron(cron).nextExecution(testDate);
    assertEquals(new DateTime(2019, 5, 17, 8, 0, 0), dateTime);
  }

  @Test
  public void calendarNextExecutionTestThree() {
    HashMap<String, Object> data = new HashMap<String, Object>() {{
      put("weekDay", 6); // sun-sat
      put("hour", 8);
      put("second", 30);
      put("minute", 25);
    }};

    Cron cron = createCronInstance(data);
    DateTime testDate = new DateTime(2019, 5, 16, 8, 1, 0);
    DateTime dateTime = ExecutionTime.forCron(cron).nextExecution(testDate);
    assertEquals(new DateTime(2019, 5, 17, 8, 25, 30), dateTime);
  }

}
