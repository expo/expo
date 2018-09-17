/**
 * @flow
 * AndroidChannel representation wrapper
 */
import { Importance, Visibility } from './types';
import type { ImportanceType, VisibilityType } from './types';

type NativeAndroidChannel = {|
  bypassDnd?: boolean,
  channelId: string,
  description?: string,
  group?: string,
  importance: ImportanceType,
  lightColor?: string,
  lightsEnabled?: boolean,
  lockScreenVisibility?: VisibilityType,
  name: string,
  showBadge?: boolean,
  sound?: string,
  vibrationEnabled?: boolean,
  vibrationPattern?: number[],
|};

export default class AndroidChannel {
  _bypassDnd: boolean | void;

  _channelId: string;

  _description: string | void;

  _group: string | void;

  _importance: ImportanceType;

  _lightColor: string | void;

  _lightsEnabled: boolean | void;

  _lockScreenVisibility: VisibilityType;

  _name: string;

  _showBadge: boolean | void;

  _sound: string | void;

  _vibrationEnabled: boolean | void;

  _vibrationPattern: number[] | void;

  constructor(channelId: string, name: string, importance: ImportanceType) {
    if (!Object.values(Importance).includes(importance)) {
      throw new Error(`AndroidChannel() Invalid Importance: ${importance}`);
    }
    this._channelId = channelId;
    this._name = name;
    this._importance = importance;
  }

  get bypassDnd(): ?boolean {
    return this._bypassDnd;
  }

  get channelId(): string {
    return this._channelId;
  }

  get description(): ?string {
    return this._description;
  }

  get group(): ?string {
    return this._group;
  }

  get importance(): ImportanceType {
    return this._importance;
  }

  get lightColor(): ?string {
    return this._lightColor;
  }

  get lightsEnabled(): ?boolean {
    return this._lightsEnabled;
  }

  get lockScreenVisibility(): ?VisibilityType {
    return this._lockScreenVisibility;
  }

  get name(): string {
    return this._name;
  }

  get showBadge(): ?boolean {
    return this._showBadge;
  }

  get sound(): ?string {
    return this._sound;
  }

  get vibrationEnabled(): ?boolean {
    return this._vibrationEnabled;
  }

  get vibrationPattern(): ?(number[]) {
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
  setLockScreenVisibility(
    lockScreenVisibility: VisibilityType
  ): AndroidChannel {
    if (!Object.values(Visibility).includes(lockScreenVisibility)) {
      throw new Error(
        `AndroidChannel:setLockScreenVisibility Invalid Visibility: ${lockScreenVisibility}`
      );
    }
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
    if (!this._channelId) {
      throw new Error('AndroidChannel: Missing required `channelId` property');
    } else if (!this._importance) {
      throw new Error('AndroidChannel: Missing required `importance` property');
    } else if (!this._name) {
      throw new Error('AndroidChannel: Missing required `name` property');
    }

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
