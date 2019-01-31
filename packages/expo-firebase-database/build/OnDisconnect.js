import { utils } from 'expo-firebase-app';
const { typeOf } = utils;
/**
 * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect
 * @class OmDisconnect
 */
export default class OnDisconnect {
    /**
     *
     * @param ref
     */
    constructor(ref) {
        this.ref = ref;
        this.path = ref.path;
        this._database = ref._database;
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#set
     * @param value
     * @returns {*}
     */
    async set(value) {
        return await this._database.nativeModule.onDisconnectSet(this.path, {
            type: typeOf(value),
            value,
        });
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#update
     * @param values
     * @returns {*}
     */
    async update(values) {
        return await this._database.nativeModule.onDisconnectUpdate(this.path, values);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#remove
     * @returns {*}
     */
    async remove() {
        return await this._database.nativeModule.onDisconnectRemove(this.path);
    }
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#cancel
     * @returns {*}
     */
    async cancel() {
        return await this._database.nativeModule.onDisconnectCancel(this.path);
    }
}
//# sourceMappingURL=OnDisconnect.js.map