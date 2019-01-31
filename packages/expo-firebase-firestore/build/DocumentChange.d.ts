import DocumentSnapshot from './DocumentSnapshot';
import { Firestore, NativeDocumentChange } from './firestoreTypes.types';
export default class DocumentChange {
    _document: DocumentSnapshot;
    _newIndex: number;
    _oldIndex: number;
    _type: 'added' | 'modified' | 'removed';
    constructor(firestore: Firestore, nativeData: NativeDocumentChange);
    readonly doc: DocumentSnapshot;
    readonly newIndex: number;
    readonly oldIndex: number;
    readonly type: string;
}
