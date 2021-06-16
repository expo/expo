// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.storage;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.annotation.Unique;
import com.raizlabs.android.dbflow.structure.BaseModel;

@Table(database = ExponentDB.class)
public class ExperienceDBObject extends BaseModel {

  @Column(name = "id")
  @PrimaryKey
  public String scopeKey;

  @Column
  public String manifestUrl;

  @Column
  public String bundleUrl;

  @Column
  public String manifest;

}
