import DocumentSnapshot from './DocumentSnapshot';
export default class DocumentChange {
    constructor(firestore, nativeData) {
        this._document = new DocumentSnapshot(firestore, nativeData.document);
        this._newIndex = nativeData.newIndex;
        this._oldIndex = nativeData.oldIndex;
        this._type = nativeData.type;
    }
    get doc() {
        return this._document;
    }
    get newIndex() {
        return this._newIndex;
    }
    get oldIndex() {
        return this._oldIndex;
    }
    get type() {
        return this._type;
    }
}
//# sourceMappingURL=DocumentChange.js.map