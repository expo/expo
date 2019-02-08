import invariant from 'invariant';

import { Importance, Visibility, NativeAndroidChannel } from './types';

export default class AndroidChannel {
  _bypassDnd?: boolean;

  _channelId: string;

  _description?: string;

  _group?: string;

  _importance: Importance;

  _lightColor?: string;

  _lightsEnabled?: boolean;

  _lockScreenVisibility?: Visibility;

  _name: string;

  _showBadge?: boolean;

  _sound?: string;

  _vibrationEnabled?: boolean;

  _vibrationPattern?: number[];

  constructor(channelId: string, name: string, importance: Importance) {
    invariant(
      Object.values(Importance).includes(importance),
      `AndroidChannel() Invalid Importance: ${importance}`
    );
    this._channelId = channelId;
    this._name = name;
    this._importance = importance;
  }

  get bypassDnd(): boolean | undefined {
    return this._bypassDnd;
  }

  get channelId(): string {
    return this._channelId;
  }

  get description(): string | undefined {
    return this._description;
  }

  get group(): string | undefined {
    return this._group;
  }

  get importance(): Importance {
    return this._importance;
  }

  get lightColor(): string | undefined {
    return this._lightColor;
  }

  get lightsEnabled(): boolean | undefined {
    return this._lightsEnabled;
  }

  get lockScreenVisibility(): Visibility | undefined {
    return this._lockScreenVisibility;
  }

  get name(): string {
    return this._name;
  }

  get showBadge(): boolean | undefined {
    return this._showBadge;
  }

  get sound(): string | undefined {
    return this._sound;
  }

  get vibrationEnabled(): boolean | undefined {
    return this._vibrationEnabled;
  }

  get vibrationPattern(): number[] | undefined {
    return this._vibrationPattern;
  }

  /**
   *
   * @param lightsEnabled
   * @returns {AndroidChannel}
   */
  enableLights(lightsEnabled: boolean): AndroidChannel {
    this._lightsEnabled = lightsEnabled;
    return this;
  }

  /**
   *
   * @param vibrationEnabled
   * @returns {AndroidChannel}
   */
  enableVibration(vibrationEnabled: boolean): AndroidChannel {
    this._vibrationEnabled = vibrationEnabled;
    return this;
  }

  /**
   *
   * @param bypassDnd
   * @returns {AndroidChannel}
   */
  setBypassDnd(bypassDnd: boolean): AndroidChannel {
    this._bypassDnd = bypassDnd;
    return this;
  }

  /**
   *
   * @param description
   * @returns {AndroidChannel}
   */
  setDescription(description: string): AndroidChannel {
    this._description = description;
    return this;
  }

  /**
   *
   * @param group
   * @returns {AndroidChannel}
   */
  setGroup(groupId: string): AndroidChannel {
    this._group = groupId;
    return this;
  }

  /**
   *
   * @param lightColor
   * @returns {AndroidChannel}
   */
  setLightColor(lightColor: string): AndroidChannel {
    this._lightColor = lightColor;
    return this;
  }

  /**
   *
   * @param lockScreenVisibility
   * @returns {AndroidChannel}
   */
  setLockScreenVisibility(lockScreenVisibility: Visibility): AndroidChannel {
    invariant(
      Object.values(Visibility).includes(lockScreenVisibility),
      `AndroidChannel:setLockScreenVisibility Invalid Visibility: ${lockScreenVisibility}`
    );
    this._lockScreenVisibility = lockScreenVisibility;
    return this;
  }

  /**
   *
   * @param showBadge
   * @returns {AndroidChannel}
   */
  setShowBadge(showBadge: boolean): AndroidChannel {
    this._showBadge = showBadge;
    return this;
  }

  /**
   *
   * @param sound
   * @returns {AndroidChannel}
   */
  setSound(sound: string): AndroidChannel {
    this._sound = sound;
    return this;
  }

  /**
   *
   * @param vibrationPattern
   * @returns {AndroidChannel}
   */
  setVibrationPattern(vibrationPattern: number[]): AndroidChannel {
    this._vibrationPattern = vibrationPattern;
    return this;
  }

  build(): NativeAndroidChannel {
    invariant(this._channelId, 'AndroidChannel: Missing required `channelId` property');
    invariant(this._importance, 'AndroidChannel: Missing required `importance` property');
    invariant(this._name, 'AndroidChannel: Missing required `name` property');

    return {
      bypassDnd: this._bypassDnd,
      channelId: this._channelId,
      description: this._description,
      group: this._group,
      importance: this._importance,
      lightColor: this._lightColor,
      lightsEnabled: this._lightsEnabled,
      lockScreenVisibility: this._lockScreenVisibility,
      name: this._name,
      showBadge: this._showBadge,
      sound: this._sound,
      vibrationEnabled: this._vibrationEnabled,
      vibrationPattern: this._vibrationPattern,
    };
  }
}
