package host.exp.exponent.notifications.exceptions;

import org.unimodules.core.errors.CodedException;

public class UnableToScheduleException extends CodedException {

  static final String message = "Probably there won't be any time in the future when notification can be scheduled";

  public UnableToScheduleException() {
    super(message);
  }

  public UnableToScheduleException(String message) {
    super(message);
  }

  @Override
  public String getCode() {
    return "E_NOTIFICATION_CANNOT_BE_SCHEDULED";
  }
}
