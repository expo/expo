package expo.modules.interfaces.permissions;

public enum PermissionsStatus {
  GRANTED("granted"),
  UNDETERMINED("undetermined"),
  DENIED("denied");

  private final String status;

  PermissionsStatus(String status) {
    this.status = status;
  }

  public String getStatus() {
    return status;
  }
}
