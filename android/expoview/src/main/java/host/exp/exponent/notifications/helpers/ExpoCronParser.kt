package host.exp.exponent.notifications.helpers

import com.cronutils.builder.CronBuilder
import com.cronutils.model.Cron
import com.cronutils.model.field.expression.FieldExpressionFactory
import java.util.*

object ExpoCronParser {
  @JvmStatic fun createCronInstance(options: HashMap<String?, Any?>): Cron {
    val cronBuilder = CronBuilder.cron(ExpoCronDefinitionBuilder.cronDefinition)

    val year = options["year"]
    if (year is Number) {
      cronBuilder.withYear(FieldExpressionFactory.on(year.toInt()))
    } else {
      cronBuilder.withYear(FieldExpressionFactory.always())
    }

    val hour = options["hour"]
    if (hour is Number) {
      cronBuilder.withHour(FieldExpressionFactory.on(hour.toInt()))
    } else {
      cronBuilder.withHour(FieldExpressionFactory.always())
    }

    val minute = options["minute"]
    if (minute is Number) {
      cronBuilder.withMinute(FieldExpressionFactory.on(minute.toInt()))
    } else {
      cronBuilder.withMinute(FieldExpressionFactory.always())
    }

    val second = options["second"]
    if (second is Number) {
      cronBuilder.withSecond(FieldExpressionFactory.on(second.toInt()))
    } else {
      cronBuilder.withSecond(FieldExpressionFactory.always())
    }

    val month = options["month"]
    if (month is Number) {
      cronBuilder.withMonth(FieldExpressionFactory.on(month.toInt()))
    } else {
      cronBuilder.withMonth(FieldExpressionFactory.always())
    }

    val day = options["day"]
    if (day is Number) {
      cronBuilder.withDoM(FieldExpressionFactory.on(day.toInt()))
    } else if (options.containsKey("weekDay")) {
      cronBuilder.withDoM(FieldExpressionFactory.questionMark())
    } else {
      cronBuilder.withDoM(FieldExpressionFactory.always())
    }

    val weekDay = options["weekDay"]
    if (weekDay is Number) {
      cronBuilder.withDoW(FieldExpressionFactory.on(weekDay.toInt()))
    } else {
      cronBuilder.withDoW(FieldExpressionFactory.questionMark())
    }

    return cronBuilder.instance()
  }
}
