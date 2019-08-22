package org.unimodules.interfaces.permissions;

public enum PermissionsStatus {
  GRANTED("granted"),
  UNDETERMINED("undetermined"),
  DENIED("denied");

  private String jsString;

  PermissionsStatus(String jsString) {
    this.jsString = jsString;
  }

  public String getJsString() {
    return jsString;
  }
}
