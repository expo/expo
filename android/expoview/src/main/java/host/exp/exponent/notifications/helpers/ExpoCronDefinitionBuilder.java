package host.exp.exponent.notifications.helpers;

import com.cronutils.model.Cron;
import com.cronutils.model.definition.CronConstraint;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.field.CronFieldName;
import com.cronutils.model.field.expression.QuestionMark;

/*
The following class provides the format of date and time. It's almost the same as quartz but with
fixed validator.
Use this link to see how it works: https://github.com/jmrozanec/cron-utils/tree/4.x.y
 */

public class ExpoCronDefinitionBuilder {


  public static CronDefinition getCronDefinition() {
    return CronDefinitionBuilder.defineCron()
        .withSeconds().and()
        .withMinutes().and()
        .withHours().and()
        .withDayOfMonth().supportsHash().supportsL().supportsW().supportsLW().supportsQuestionMark().and()
        .withMonth().and()
        .withDayOfWeek().withValidRange(1, 7).withMondayDoWValue(2).supportsHash().supportsL().supportsW().supportsQuestionMark().and()
        .withYear().withValidRange(1970, 2099).and()
        .lastFieldOptional()
        .withCronValidation(
            ExpoCronDefinitionBuilder.getCronConstraint())
        .instance(); // quartz with corrected validation
  }

  public static CronConstraint getCronConstraint() {
    return new CronConstraint("Both, a day-of-week AND a day-of-month parameter, are not supported.") {
      @Override
      public boolean validate(Cron cron) {
        boolean presentDayOfWeek = !(cron.retrieve(CronFieldName.DAY_OF_MONTH).getExpression() instanceof QuestionMark);
        boolean presentDayOfMonth = !(cron.retrieve(CronFieldName.DAY_OF_WEEK).getExpression() instanceof QuestionMark);
        return !(presentDayOfMonth && presentDayOfWeek);
      }
    };
  }

}
