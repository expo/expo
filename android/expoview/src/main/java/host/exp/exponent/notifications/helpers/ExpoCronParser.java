package host.exp.exponent.notifications.helpers;

import com.cronutils.builder.CronBuilder;
import com.cronutils.model.Cron;

import java.util.HashMap;

import static com.cronutils.model.field.expression.FieldExpressionFactory.always;
import static com.cronutils.model.field.expression.FieldExpressionFactory.on;
import static com.cronutils.model.field.expression.FieldExpressionFactory.questionMark;

public class ExpoCronParser {
  public static Cron createCronInstance(HashMap<String, Object> options) {
    CronBuilder cronBuilder = CronBuilder.cron(ExpoCronDefinitionBuilder.getCronDefinition());

    if (options.get("year") instanceof Number) {
      cronBuilder.withYear(on(((Number) options.get("year")).intValue()));
    } else {
      cronBuilder.withYear(always());
    }

    if (options.get("hour") instanceof Number) {
      cronBuilder.withHour(on(((Number) options.get("hour")).intValue()));
    } else {
      cronBuilder.withHour(always());
    }

    if (options.get("minute") instanceof Number) {
      cronBuilder.withMinute(on(((Number) options.get("minute")).intValue()));
    } else {
      cronBuilder.withMinute(always());
    }

    if (options.get("second") instanceof Number) {
      cronBuilder.withSecond(on(((Number) options.get("second")).intValue()));
    } else {
      cronBuilder.withSecond(always());
    }

    if (options.get("month") instanceof Number) {
      cronBuilder.withMonth(on(((Number) options.get("month")).intValue()));
    } else {
      cronBuilder.withMonth(always());
    }

    if (options.get("day") instanceof Number) {
      cronBuilder.withDoM(on(((Number) options.get("day")).intValue()));
    } else if(options.containsKey("weekDay")) {
      cronBuilder.withDoM(questionMark());
    } else {
      cronBuilder.withDoM(always());
    }

    if (options.get("weekDay") instanceof Number) {
      cronBuilder.withDoW(on(((Number) options.get("weekDay")).intValue()));
    } else {
      cronBuilder.withDoW(questionMark());
    }

    return cronBuilder.instance();
  }
}
