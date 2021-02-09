import * as React from 'react';
import { ProgressViewIOS } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ProgressViewIOSScreen() {
  return (
    <Page>
      <Section title="Custom Color">
        <ProgressViewExample initialProgress={0} />
        <ProgressViewExample progressTintColor="red" initialProgress={0.4} />
        <ProgressViewExample progressTintColor="orange" initialProgress={0.6} />
        <ProgressViewExample progressTintColor="yellow" initialProgress={0.8} />
      </Section>
    </Page>
  );
}

ProgressViewIOSScreen.navigationOptions = {
  title: 'ProgressViewIOS',
};

interface ProgressViewExampleProps {
  progressTintColor?: string;
  initialProgress: number;
}

interface ProgressViewExampleState {
  progress: number;
}

class ProgressViewExample extends React.Component<
  ProgressViewExampleProps,
  ProgressViewExampleState
> {
  constructor(props: ProgressViewExampleProps) {
    super(props);

    this.state = {
      progress: props.initialProgress,
    };
  }

  render() {
    const progressStyle = { marginTop: 20 };

    return (
      <ProgressViewIOS
        style={progressStyle}
        progressTintColor={this.props.progressTintColor}
        progress={this.state.progress}
      />
    );
  }
}
