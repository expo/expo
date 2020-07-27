import * as React from 'react';

import { SNACK_URL } from '../../common/snack';

import DocumentationPageContext from '~/components/DocumentationPageContext';

export default class SnackEmbed extends React.Component {
  static contextType = DocumentationPageContext;

  componentDidMount() {
    var script = document.getElementById('snack');
    // inject script if it hasn't been loaded by a previous page
    if (!script) {
      script = document.createElement('script');
      script.src = `${this.props.snackId ? 'https://snack.expo.io' : SNACK_URL}/embed.js`;
      script.async = true;
      script.id = 'snack';

      document.body.appendChild(script);
      script.addEventListener('load', () => {
        window.ExpoSnack.initialize();
      });
    }

    if (window.ExpoSnack) {
      window.ExpoSnack.initialize();
    }
  }

  render() {
    // TODO(abi): Handle `data-snack-sdk-version` somehow
    // maybe using `context`?

    // get snack data from snack id or from inline code
    var embedProps;
    if (this.props.snackId) {
      embedProps = { 'data-snack-id': this.props.snackId };
    } else {
      let code = React.Children.toArray(this.props.children)
        .join('')
        .trim();
      embedProps = {
        'data-snack-code': code,
      };
      if (this.props.hasOwnProperty('name')) {
        embedProps['data-snack-name'] = this.props.name;
      }
      if (this.props.hasOwnProperty('description')) {
        embedProps['data-snack-description'] = this.props.description;
      }
    }

    // fill in default options for snack styling
    if (this.props.hasOwnProperty('platform')) {
      embedProps['data-snack-platform'] = this.props.platform;
    } else {
      embedProps['data-snack-platform'] = 'ios';
    }

    if (this.props.hasOwnProperty('preview')) {
      embedProps['data-snack-preview'] = this.props.preview;
    } else {
      embedProps['data-snack-preview'] = false;
    }

    if (this.props.hasOwnProperty('theme')) {
      embedProps['data-snack-theme'] = this.props.theme;
    } else {
      embedProps['data-snack-theme'] = 'light';
    }

    var embedStyle = {};
    if (this.props.hasOwnProperty('style')) {
      embedStyle = this.props.style;
    }

    return (
      <div
        {...embedProps}
        style={{
          overflow: 'hidden',
          background: '#fafafa',
          borderWidth: 1,
          borderStyle: 'solid',
          height: 505,
          maxWidth: '1200px',
          borderRadius: 4,
          borderColor: 'rgba(0,0,0,.16)',
          ...embedStyle,
        }}
      />
    );
  }
}
