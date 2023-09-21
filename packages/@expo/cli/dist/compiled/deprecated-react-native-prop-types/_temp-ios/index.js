'use strict';

module.exports = {
  get ColorPropType() {
    return require('./DeprecatedColorPropType');
  },
  get EdgeInsetsPropType() {
    return require('./DeprecatedEdgeInsetsPropType');
  },
  get ImagePropTypes() {
    return require('./DeprecatedImagePropType');
  },
  get PointPropType() {
    return require('./DeprecatedPointPropType');
  },
  get TextInputPropTypes() {
    return require('./DeprecatedTextInputPropTypes');
  },
  get TextPropTypes() {
    return require('./DeprecatedTextPropTypes');
  },
  get ViewPropTypes() {
    return require('./DeprecatedViewPropTypes');
  }
};