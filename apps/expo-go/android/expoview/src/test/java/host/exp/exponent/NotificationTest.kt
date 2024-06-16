package host.exp.exponent

import host.exp.exponent.notifications.helpers.ExpoCronParser.createCronInstance
import com.cronutils.model.time.ExecutionTime
import org.joda.time.DateTime
import org.junit.Assert
import org.junit.Test
import java.util.HashMap

class NotificationTest {
  @Test
  fun calendarNextExecutionTestOne() {
    val data: HashMap<String?, Any?> = object : HashMap<String?, Any?>() {
      init {
        put("day", 10)
        put("month", 12)
        put("year", 2020)
      }
    }
    val cron = createCronInstance(data)
    val testDate = DateTime(2019, 1, 1, 10, 10, 0)
    val dateTime = ExecutionTime.forCron(cron).nextExecution(testDate)
    Assert.assertEquals(DateTime(2020, 12, 10, 0, 0, 0), dateTime)
  }

  @Test
  fun calendarNextExecutionTestTwo() {
    val data: HashMap<String?, Any?> = object : HashMap<String?, Any?>() {
      init {
        put("weekDay", 6) // sun-sat
        put("month", 5)
        put("hour", 8)
        put("second", 0)
        put("minute", 0)
      }
    }
    val cron = createCronInstance(data)
    val testDate = DateTime(2019, 5, 16, 8, 1, 0)
    val dateTime = ExecutionTime.forCron(cron).nextExecution(testDate)
    Assert.assertEquals(DateTime(2019, 5, 17, 8, 0, 0), dateTime)
  }

  @Test
  fun calendarNextExecutionTestThree() {
    val data: HashMap<String?, Any?> = object : HashMap<String?, Any?>() {
      init {
        put("weekDay", 6) // sun-sat
        put("hour", 8)
        put("second", 30)
        put("minute", 25)
      }
    }
    val cron = createCronInstance(data)
    val testDate = DateTime(2019, 5, 16, 8, 1, 0)
    val dateTime = ExecutionTime.forCron(cron).nextExecution(testDate)
    Assert.assertEquals(DateTime(2019, 5, 17, 8, 25, 30), dateTime)
  }
}
