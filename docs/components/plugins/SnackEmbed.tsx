import * as React from 'react';

import { SNACK_URL } from '../../common/snack';

type Props = React.PropsWithChildren<{
  snackId?: string;
  name?: string;
  description?: string;
  platform?: string;
  preview?: boolean;
  theme?: string;
  style?: React.CSSProperties;
}>;

const SnackEmbed = ({
  snackId,
  name,
  description,
  platform,
  preview,
  theme,
  style,
  children,
}: Props) => {
  React.useEffect(() => {
    let script = document.getElementById('snack') as HTMLScriptElement;
    // inject script if it hasn't been loaded by a previous page
    if (!script) {
      script = document.createElement('script');
      script.src = `${snackId ? 'https://snack.expo.dev' : SNACK_URL}/embed.js`;
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
  }, [snackId]);

  // TODO(abi): Handle `data-snack-sdk-version` somehow
  // maybe using `context`?

  // get snack data from snack id or from inline code
  // TODO (barthap): Type all possible keys for this
  let embedProps: Record<string, any>;
  if (snackId) {
    embedProps = { 'data-snack-id': snackId };
  } else {
    const code = React.Children.toArray(children).join('').trim();
    embedProps = {
      'data-snack-code': code,
    };
    if (name) {
      embedProps['data-snack-name'] = name;
    }
    if (description) {
      embedProps['data-snack-description'] = description;
    }
  }

  // fill in default options for snack styling
  if (platform) {
    embedProps['data-snack-platform'] = platform;
  } else {
    embedProps['data-snack-platform'] = 'ios';
  }

  if (preview) {
    embedProps['data-snack-preview'] = preview;
  } else {
    embedProps['data-snack-preview'] = false;
  }

  if (theme) {
    embedProps['data-snack-theme'] = theme;
  } else {
    embedProps['data-snack-theme'] = 'light';
  }

  const embedStyle = style ? style! : {};

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
};

export default SnackEmbed;
