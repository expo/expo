package versioned.host.exp.exponent.modules.api.notifications.helpers;

import com.cronutils.builder.CronBuilder;
import com.cronutils.model.Cron;

import java.util.HashMap;

import static com.cronutils.model.field.expression.FieldExpressionFactory.always;
import static com.cronutils.model.field.expression.FieldExpressionFactory.on;
import static com.cronutils.model.field.expression.FieldExpressionFactory.questionMark;

public class ExpoCronParser {
  public static Cron createCronInstance(HashMap<String, Object> options) {
    CronBuilder cronBuilder = CronBuilder.cron(ExpoCronDefinitionBuilder.getCronDefinition());

    if (options.containsKey("year")) {
      cronBuilder.withYear(on(((Number) options.get("year")).intValue()));
    } else {
      cronBuilder.withYear(always());
    }

    if (options.containsKey("hour")) {
      cronBuilder.withHour(on(((Number) options.get("hour")).intValue()));
    } else {
      cronBuilder.withHour(always());
    }

    if (options.containsKey("minute")) {
      cronBuilder.withMinute(on(((Number) options.get("minute")).intValue()));
    } else {
      cronBuilder.withMinute(always());
    }

    if (options.containsKey("second")) {
      cronBuilder.withSecond(on(((Number) options.get("second")).intValue()));
    } else {
      cronBuilder.withSecond(always());
    }

    if (options.containsKey("month")) {
      cronBuilder.withMonth(on(((Number) options.get("month")).intValue()));
    } else {
      cronBuilder.withMonth(always());
    }

    if (options.containsKey("day")) {
      cronBuilder.withDoM(on(((Number) options.get("day")).intValue()));
    } else if(options.containsKey("weekDay")) {
      cronBuilder.withDoM(questionMark());
    } else {
      cronBuilder.withDoM(always());
    }

    if (options.containsKey("weekDay")) {
      cronBuilder.withDoW(on(((Number) options.get("weekDay")).intValue()));
    } else {
      cronBuilder.withDoW(questionMark());
    }

    return cronBuilder.instance();
  }
}
