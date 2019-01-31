import { NativeInboundRemoteMessage, NativeOutboundRemoteMessage } from './types';
export default class RemoteMessage {
    _collapseKey?: string;
    _data: {
        [key: string]: string;
    };
    _from?: string;
    _messageId: string;
    _messageType?: string;
    _sentTime?: number;
    _to?: string;
    _ttl: number;
    constructor(inboundMessage?: NativeInboundRemoteMessage);
    readonly collapseKey: string | undefined;
    readonly data: {
        [key: string]: string;
    };
    readonly from: string | undefined;
    readonly messageId: string;
    readonly messageType: string | undefined;
    readonly sentTime: number | undefined;
    readonly to: string | undefined;
    readonly ttl: number;
    /**
     *
     * @param collapseKey
     * @returns {RemoteMessage}
     */
    setCollapseKey(collapseKey: string): RemoteMessage;
    /**
     *
     * @param data
     * @returns {RemoteMessage}
     */
    setData(data?: {
        [key: string]: string;
    }): this;
    /**
     *
     * @param messageId
     * @returns {RemoteMessage}
     */
    setMessageId(messageId: string): RemoteMessage;
    /**
     *
     * @param messageType
     * @returns {RemoteMessage}
     */
    setMessageType(messageType: string): RemoteMessage;
    /**
     *
     * @param to
     * @returns {RemoteMessage}
     */
    setTo(to: string): RemoteMessage;
    /**
     *
     * @param ttl
     * @returns {RemoteMessage}
     */
    setTtl(ttl: number): RemoteMessage;
    build(): NativeOutboundRemoteMessage;
}
