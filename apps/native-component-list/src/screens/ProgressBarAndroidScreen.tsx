import * as React from 'react';
import { ProgressBarAndroid } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ProgressBarAndroidScreen() {
  return (
    <Page>
      <Section title="Custom Color">
        <ProgressBarExample initialProgress={0} />
        <ProgressBarExample progressTintColor="red" initialProgress={0.4} />
        <ProgressBarExample progressTintColor="orange" initialProgress={0.6} />
        <ProgressBarExample progressTintColor="yellow" initialProgress={0.8} />
      </Section>
    </Page>
  );
}

ProgressBarAndroidScreen.navigationOptions = {
  title: 'ProgressBarAndroid',
};

interface ProgressBarExampleProps {
  progressTintColor?: string;
  initialProgress: number;
}

interface ProgressBarExampleState {
  progress: number;
  timeoutId?: any;
}

class ProgressBarExample extends React.Component<ProgressBarExampleProps, ProgressBarExampleState> {
  constructor(props: ProgressBarExampleProps) {
    super(props);

    this.state = {
      progress: props.initialProgress,
    };
  }

  componentDidMount() {
    this.progressLoop();
  }

  componentWillUnmount() {
    clearTimeout(this.state.timeoutId);
  }

  progressLoop() {
    const timeout = setTimeout(() => {
      this.setState((state) => ({
        progress: state.progress === 1 ? 0 : Math.min(1, state.progress + 0.01),
      }));

      this.progressLoop();
    }, 17 * 2);
    this.setState({ timeoutId: timeout });
  }

  render() {
    const progressStyle = { marginTop: 20 };

    return (
      <ProgressBarAndroid
        styleAttr="Horizontal"
        style={progressStyle}
        color={this.props.progressTintColor}
        progress={this.state.progress}
      />
    );
  }
}
