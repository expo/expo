import * as React from 'react';
import * as Constants from '~/common/constants';

export default class Footer extends React.PureComponent {
  render() {
    return (
      <div
        className="footnote"
        style={{
          padding: '40px 0px',
          textAlign: 'center',
          lineHeight: '1.5rem',
          borderTop: `solid 1px ${Constants.colors.black10}`,
        }}>
        Still have questions? <a href="https://forums.expo.io/">Ask on our forums!</a>
        <br />
        <a
          className="pr"
          style={{ fontSize: '0.8rem' }}
          href={'https://github.com/expo/expo-docs/'}>
          You can edit these docs by sending us a PR
        </a>
        <style jsx>
          {`
            .footnote a {
              color: ${Constants.colors.expoLighter};
              text-decoration: none;
            }

            .footnote a:hover {
              text-decoration: underline;
            }
          `}
        </style>
      </div>
    );
  }
}
