package abi40_0_0.org.unimodules.interfaces.permissions;

public enum PermissionsStatus {
  GRANTED("granted"),
  UNDETERMINED("undetermined"),
  DENIED("denied");

  private String status;

  PermissionsStatus(String status) {
    this.status = status;
  }

  public String getStatus() {
    return status;
  }
}
