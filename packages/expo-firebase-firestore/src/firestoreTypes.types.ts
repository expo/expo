export type Firestore = { [key: string]: any };

export type MetadataChanges = {
  includeMetadataChanges: boolean;
};

export type QueryDirection = 'DESC' | 'desc' | 'ASC' | 'asc';

export type QueryOperator = '<' | '<=' | '=' | '==' | '>' | '>=';

export type GetOptions = {
  source: 'default' | 'server' | 'cache';
};

export type SetOptions = {
  merge?: boolean;
};

export type SnapshotOptions = {
  INNER?: string;
};

export type SnapshotMetadata = {
  fromCache: boolean;
  hasPendingWrites: boolean;
};

export type NativeDocumentChange = {
  document: NativeDocumentSnapshot;
  newIndex: number;
  oldIndex: number;
  type: 'added' | 'modified' | 'removed';
};

export type NativeDocumentSnapshot = {
  data: { [key: string]: NativeTypeMap };
  metadata: SnapshotMetadata;
  path: string;
};

export type NativeTypeMap = {
  type:
    | 'infinity'
    | 'nan'
    | 'array'
    | 'boolean'
    | 'date'
    | 'blob'
    | 'documentid'
    | 'fieldvalue'
    | 'geopoint'
    | 'null'
    | 'number'
    | 'object'
    | 'reference'
    | 'string';
  value: any;
};
