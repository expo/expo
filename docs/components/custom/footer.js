import * as React from 'react';
import * as Constants from '~/common/constants';

export default class Footer extends React.PureComponent {
  render() {
    return (
      <footer>
        Still have questions? <a href="https://forums.expo.io/">Ask on our forums!</a>
        <br />
        <a href={'https://github.com/expo/expo-docs/'}>
          You can edit these docs by sending us a PR
        </a>
      </footer>
    );
  }
}
