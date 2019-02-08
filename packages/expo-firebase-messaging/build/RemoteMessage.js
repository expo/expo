import invariant from 'invariant';
import { utils } from 'expo-firebase-app';
const { isObject, generatePushID } = utils;
export default class RemoteMessage {
    constructor(inboundMessage) {
        this._data = {};
        this._messageId = generatePushID();
        if (inboundMessage) {
            this._collapseKey = inboundMessage.collapseKey;
            this._data = inboundMessage.data;
            this._from = inboundMessage.from;
            this._messageId = inboundMessage.messageId;
            this._messageType = inboundMessage.messageType;
            this._sentTime = inboundMessage.sentTime;
        }
        // defaults
        this._data = this._data || {};
        // TODO: Is this the best way to generate an ID?
        this._messageId = this._messageId || generatePushID();
        this._ttl = 3600;
    }
    get collapseKey() {
        return this._collapseKey;
    }
    get data() {
        return this._data;
    }
    get from() {
        return this._from;
    }
    get messageId() {
        return this._messageId;
    }
    get messageType() {
        return this._messageType;
    }
    get sentTime() {
        return this._sentTime;
    }
    get to() {
        return this._to;
    }
    get ttl() {
        return this._ttl;
    }
    /**
     *
     * @param collapseKey
     * @returns {RemoteMessage}
     */
    setCollapseKey(collapseKey) {
        this._collapseKey = collapseKey;
        return this;
    }
    /**
     *
     * @param data
     * @returns {RemoteMessage}
     */
    setData(data = {}) {
        invariant(isObject(data), `RemoteMessage:setData expects an object but got type '${typeof data}'.`);
        this._data = data;
        return this;
    }
    /**
     *
     * @param messageId
     * @returns {RemoteMessage}
     */
    setMessageId(messageId) {
        this._messageId = messageId;
        return this;
    }
    /**
     *
     * @param messageType
     * @returns {RemoteMessage}
     */
    setMessageType(messageType) {
        this._messageType = messageType;
        return this;
    }
    /**
     *
     * @param to
     * @returns {RemoteMessage}
     */
    setTo(to) {
        this._to = to;
        return this;
    }
    /**
     *
     * @param ttl
     * @returns {RemoteMessage}
     */
    setTtl(ttl) {
        this._ttl = ttl;
        return this;
    }
    build() {
        if (!this._data)
            throw new Error('RemoteMessage: Missing required `data` property');
        if (!this._messageId)
            throw new Error('RemoteMessage: Missing required `messageId` property');
        if (!this._to)
            throw new Error('RemoteMessage: Missing required `to` property');
        if (!this._ttl)
            throw new Error('RemoteMessage: Missing required `ttl` property');
        return {
            collapseKey: this._collapseKey,
            data: this._data,
            messageId: this._messageId,
            messageType: this._messageType,
            to: this._to,
            ttl: this._ttl,
        };
    }
}
//# sourceMappingURL=RemoteMessage.js.map