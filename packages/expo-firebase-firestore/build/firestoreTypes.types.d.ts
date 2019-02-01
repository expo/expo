export declare type Firestore = {
    [key: string]: any;
};
export declare type MetadataChanges = {
    includeMetadataChanges: boolean;
};
export declare type QueryDirection = 'DESC' | 'desc' | 'ASC' | 'asc';
export declare type QueryOperator = '<' | '<=' | '=' | '==' | '>' | '>=';
export declare type GetOptions = {
    source: 'default' | 'server' | 'cache';
};
export declare type SetOptions = {
    merge?: boolean;
};
export declare type SnapshotOptions = {
    INNER?: string;
};
export declare type SnapshotMetadata = {
    fromCache: boolean;
    hasPendingWrites: boolean;
};
export declare type NativeDocumentChange = {
    document: NativeDocumentSnapshot;
    newIndex: number;
    oldIndex: number;
    type: 'added' | 'modified' | 'removed';
};
export declare type NativeDocumentSnapshot = {
    data: {
        [key: string]: NativeTypeMap;
    };
    metadata: SnapshotMetadata;
    path: string;
};
export declare type NativeTypeMap = {
    type: 'infinity' | 'nan' | 'array' | 'boolean' | 'date' | 'blob' | 'documentid' | 'fieldvalue' | 'geopoint' | 'null' | 'number' | 'object' | 'reference' | 'string';
    value: any;
};
