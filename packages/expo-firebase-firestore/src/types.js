/*
 * @flow
 */

export type MetadataChanges = {|
  includeMetadataChanges: boolean,
|};

export type QueryDirection = 'DESC' | 'desc' | 'ASC' | 'asc';

export type QueryOperator = '<' | '<=' | '=' | '==' | '>' | '>=';

export type GetOptions = {
  source: 'default' | 'server' | 'cache',
};

export type SetOptions = {
  merge?: boolean,
};

export type SnapshotMetadata = {
  fromCache: boolean,
  hasPendingWrites: boolean,
};

export type NativeDocumentChange = {
  document: NativeDocumentSnapshot,
  newIndex: number,
  oldIndex: number,
  type: string,
};

export type NativeDocumentSnapshot = {
  data: { [string]: NativeTypeMap },
  metadata: SnapshotMetadata,
  path: string,
};

export type NativeTypeMap = {
  type:
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
    | 'string',
  value: any,
};
