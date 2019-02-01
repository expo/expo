import DocumentReference from './DocumentReference';
import FieldPath from './FieldPath';
import { Firestore, NativeDocumentSnapshot, SnapshotMetadata } from './firestoreTypes.types';
/**
 * @class DocumentSnapshot
 */
export default class DocumentSnapshot {
    _data: Object | void;
    _metadata: SnapshotMetadata;
    _ref: DocumentReference;
    constructor(firestore: Firestore, nativeData: NativeDocumentSnapshot);
    readonly exists: boolean;
    readonly id: string | null;
    readonly metadata: SnapshotMetadata;
    readonly ref: DocumentReference;
    data: () => void | Object;
    get: (fieldPath: string | FieldPath) => any;
}
