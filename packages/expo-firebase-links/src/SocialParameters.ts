import { DynamicLink, NativeSocialParameters } from './types';

export default class SocialParameters {
  _descriptionText?: string;

  _imageUrl?: string;

  _link: DynamicLink;

  _title?: string;

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
