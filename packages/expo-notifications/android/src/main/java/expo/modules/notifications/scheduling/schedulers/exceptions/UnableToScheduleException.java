package expo.modules.notifications.scheduling.schedulers.exceptions;


public class UnableToScheduleException extends Exception {

  static final String message = "Probably there won't be any time in the future when notification can be scheduled";

  public UnableToScheduleException() {
    super(message);
  }

  public UnableToScheduleException(String message) {
    super(message);
  }

}
