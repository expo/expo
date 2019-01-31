declare type Database = {
    [key: string]: any;
};
declare type Reference = {
    [key: string]: any;
};
/**
 * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect
 * @class OmDisconnect
 */
export default class OnDisconnect {
    _database: Database;
    ref: Reference;
    path: string;
    /**
     *
     * @param ref
     */
    constructor(ref: Reference);
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#set
     * @param value
     * @returns {*}
     */
    set(value: string | Object): Promise<void>;
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#update
     * @param values
     * @returns {*}
     */
    update(values: Object): Promise<void>;
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#remove
     * @returns {*}
     */
    remove(): Promise<void>;
    /**
     * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#cancel
     * @returns {*}
     */
    cancel(): Promise<void>;
}
export {};
