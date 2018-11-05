/**
 * @flow
 * SocialParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeSocialParameters } from './types';

export default class SocialParameters {
  _descriptionText: string | void;

  _imageUrl: string | void;

  _link: DynamicLink;

  _title: string | void;

  constructor(link: DynamicLink) {
    this._link = link;
  }

  /**
   *
   * @param descriptionText
   * @returns {DynamicLink}
   */
  setDescriptionText(descriptionText: string): DynamicLink {
    this._descriptionText = descriptionText;
    return this._link;
  }

  /**
   *
   * @param imageUrl
   * @returns {DynamicLink}
   */
  setImageUrl(imageUrl: string): DynamicLink {
    this._imageUrl = imageUrl;
    return this._link;
  }

  /**
   *
   * @param title
   * @returns {DynamicLink}
   */
  setTitle(title: string): DynamicLink {
    this._title = title;
    return this._link;
  }

  build(): NativeSocialParameters {
    return {
      descriptionText: this._descriptionText,
      imageUrl: this._imageUrl,
      title: this._title,
    };
  }
}
