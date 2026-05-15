import {
  CircularProgressIndicator,
  LinearProgressIndicator,
  CircularWavyProgressIndicator,
  LinearWavyProgressIndicator,
  Host,
  LazyColumn,
  Card,
  Column,
  Row,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function ProgressScreen() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p + 0.05) % 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Indeterminate</ComposeText>
            <ComposeText>Omit progress to animate continuously.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularProgressIndicator />
              <LinearProgressIndicator modifiers={[fillMaxWidth()]} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Determinate</ComposeText>
            <ComposeText>Provide a progress value between 0 and 1.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularProgressIndicator progress={progress} />
              <LinearProgressIndicator progress={progress} modifiers={[fillMaxWidth()]} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom colors</ComposeText>
            <ComposeText>Override indicator color and track color.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularProgressIndicator progress={progress} color="red" trackColor="#cccccc" />
              <LinearProgressIndicator
                progress={progress}
                color="red"
                trackColor="#cccccc"
                modifiers={[fillMaxWidth()]}
              />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Stroke width</ComposeText>
            <ComposeText>Circular indicators support custom stroke width.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularProgressIndicator progress={progress} strokeWidth={2} />
              <CircularProgressIndicator progress={progress} />
              <CircularProgressIndicator progress={progress} strokeWidth={8} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Stroke cap</ComposeText>
            <ComposeText>Round (default) vs butt stroke cap.</ComposeText>
            <LinearProgressIndicator
              progress={progress}
              strokeCap="round"
              modifiers={[fillMaxWidth()]}
            />
            <LinearProgressIndicator
              progress={progress}
              strokeCap="butt"
              modifiers={[fillMaxWidth()]}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Gap size</ComposeText>
            <ComposeText>Space between indicator and track.</ComposeText>
            <LinearProgressIndicator progress={progress} gapSize={0} modifiers={[fillMaxWidth()]} />
            <LinearProgressIndicator progress={progress} modifiers={[fillMaxWidth()]} />
            <LinearProgressIndicator progress={progress} gapSize={8} modifiers={[fillMaxWidth()]} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Wavy indeterminate</ComposeText>
            <ComposeText>Expressive wave animation without progress.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularWavyProgressIndicator />
              <LinearWavyProgressIndicator modifiers={[fillMaxWidth()]} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Wavy determinate</ComposeText>
            <ComposeText>Expressive wave animation with progress.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularWavyProgressIndicator progress={progress} />
              <LinearWavyProgressIndicator progress={progress} modifiers={[fillMaxWidth()]} />
            </Row>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Wavy custom colors</ComposeText>
            <ComposeText>Wave animation with custom colors.</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 16 }}>
              <CircularWavyProgressIndicator progress={progress} color="red" trackColor="#cccccc" />
              <LinearWavyProgressIndicator
                progress={progress}
                color="red"
                trackColor="#cccccc"
                modifiers={[fillMaxWidth()]}
              />
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

ProgressScreen.navigationOptions = {
  title: 'Progress',
};
