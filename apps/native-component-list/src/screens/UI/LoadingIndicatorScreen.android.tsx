import {
  ContainedLoadingIndicator,
  Host,
  LoadingIndicator,
  LazyColumn,
  Card,
  Column,
  Row,
  Text as ComposeText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function LoadingIndicatorScreen() {
  const progress = useNativeState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      progress.value = (progress.value + 0.05) % 1;
    }, 500);
    return () => clearInterval(interval);
  }, [progress]);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Indeterminate</ComposeText>
            <ComposeText>Omit progress to animate continuously.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <LoadingIndicator />
              <ContainedLoadingIndicator />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Determinate</ComposeText>
            <ComposeText>
              Pass progress from useNativeState and update progress.value between 0 and 1.
            </ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <LoadingIndicator progress={progress} />
              <ContainedLoadingIndicator progress={progress} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom colors</ComposeText>
            <ComposeText>Override indicator color.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <LoadingIndicator color="red" />
              <ContainedLoadingIndicator color="blue" />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Container color</ComposeText>
            <ComposeText>Customize the circular background on contained indicators.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <ContainedLoadingIndicator containerColor="#cccccc" />
              <ContainedLoadingIndicator containerColor="#ff4500" />
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

LoadingIndicatorScreen.navigationOptions = {
  title: 'Loading Indicator',
};
