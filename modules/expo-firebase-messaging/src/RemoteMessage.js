/**
 * @flow
 * RemoteMessage representation wrapper
 */

import { utils } from 'expo-firebase-app';
import type { NativeInboundRemoteMessage, NativeOutboundRemoteMessage } from './types';

const { isObject, generatePushID } = utils;

export default class RemoteMessage {
  _collapseKey: string | void;
  _data: { [string]: string };
  _from: string | void;
  _messageId: string;
  _messageType: string | void;
  _sentTime: number | void;
  _to: string;
  _ttl: number;

  constructor(inboundMessage?: NativeInboundRemoteMessage) {
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

  get collapseKey(): ?string {
    return this._collapseKey;
  }

  get data(): { [string]: string } {
    return this._data;
  }

  get from(): ?string {
    return this._from;
  }

  get messageId(): ?string {
    return this._messageId;
  }

  get messageType(): ?string {
    return this._messageType;
  }

  get sentTime(): ?number {
    return this._sentTime;
  }

  get to(): ?string {
    return this._to;
  }

  get ttl(): ?number {
    return this._ttl;
  }

  /**
   *
   * @param collapseKey
   * @returns {RemoteMessage}
   */
  setCollapseKey(collapseKey: string): RemoteMessage {
    this._collapseKey = collapseKey;
    return this;
  }

  /**
   *
   * @param data
   * @returns {RemoteMessage}
   */
  setData(data: { [string]: string } = {}) {
    if (!isObject(data)) {
      throw new Error(`RemoteMessage:setData expects an object but got type '${typeof data}'.`);
    }
    this._data = data;
    return this;
  }

  /**
   *
   * @param messageId
   * @returns {RemoteMessage}
   */
  setMessageId(messageId: string): RemoteMessage {
    this._messageId = messageId;
    return this;
  }

  /**
   *
   * @param messageType
   * @returns {RemoteMessage}
   */
  setMessageType(messageType: string): RemoteMessage {
    this._messageType = messageType;
    return this;
  }

  /**
   *
   * @param to
   * @returns {RemoteMessage}
   */
  setTo(to: string): RemoteMessage {
    this._to = to;
    return this;
  }

  /**
   *
   * @param ttl
   * @returns {RemoteMessage}
   */
  setTtl(ttl: number): RemoteMessage {
    this._ttl = ttl;
    return this;
  }

  build(): NativeOutboundRemoteMessage {
    if (!this._data) {
      throw new Error('RemoteMessage: Missing required `data` property');
    } else if (!this._messageId) {
      throw new Error('RemoteMessage: Missing required `messageId` property');
    } else if (!this._to) {
      throw new Error('RemoteMessage: Missing required `to` property');
    } else if (!this._ttl) {
      throw new Error('RemoteMessage: Missing required `ttl` property');
    }

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
