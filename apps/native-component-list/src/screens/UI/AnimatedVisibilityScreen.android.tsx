import {
  AnimatedVisibility,
  EnterTransition,
  ExitTransition,
  Host,
  Box,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { background, fillMaxWidth, paddingAll, width } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { ScrollView, Button } from 'react-native';

import { Page, Section } from '../../components/Page';

function ToggleButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Host matchContents>
      <Button onPress={onToggle} title={visible ? 'Hide' : 'Show'} />
    </Host>
  );
}

function DemoBox({ label, color }: { label: string; color: string }) {
  return (
    <Box contentAlignment="center" modifiers={[background(color), paddingAll(24), width(150)]}>
      <ComposeText color="#FFFFFF" style={{ fontWeight: '600', fontSize: 16 }}>
        {label}
      </ComposeText>
    </Box>
  );
}

function TransitionSection({
  title,
  label,
  color,
  enterTransition,
  exitTransition,
}: {
  title: string;
  label: string;
  color: string;
  enterTransition?: React.ComponentProps<typeof AnimatedVisibility>['enterTransition'];
  exitTransition?: React.ComponentProps<typeof AnimatedVisibility>['exitTransition'];
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <Section title={title}>
      <ToggleButton visible={visible} onToggle={() => setVisible((v) => !v)} />
      <Host matchContents>
        <Box contentAlignment="center" modifiers={[paddingAll(16), fillMaxWidth()]}>
          <AnimatedVisibility
            visible={visible}
            enterTransition={enterTransition}
            exitTransition={exitTransition}>
            <DemoBox label={label} color={color} />
          </AnimatedVisibility>
        </Box>
      </Host>
    </Section>
  );
}

export default function AnimatedVisibilityScreen() {
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TransitionSection title="Default" label="Default (fadeIn+expandIn)" color="#6200EE" />

        <TransitionSection
          title="Fade"
          label="Fade"
          color="#03DAC5"
          enterTransition={EnterTransition.fadeIn({ initialAlpha: 0.3 })}
          exitTransition={ExitTransition.fadeOut({ targetAlpha: 0.3 })}
        />

        <TransitionSection
          title="Slide Horizontal"
          label="Slide Horizontal"
          color="#FF6347"
          enterTransition={EnterTransition.slideInHorizontally({ initialOffsetX: -1.0 })}
          exitTransition={ExitTransition.slideOutHorizontally({ targetOffsetX: 1.0 })}
        />

        <TransitionSection
          title="Slide Vertical"
          label="Slide Vertical"
          color="#4CAF50"
          enterTransition={EnterTransition.slideInVertically({ initialOffsetY: -1.0 })}
          exitTransition={ExitTransition.slideOutVertically({ targetOffsetY: 1.0 })}
        />

        <TransitionSection
          title="Scale"
          label="Scale"
          color="#FF9800"
          enterTransition={EnterTransition.scaleIn({ initialScale: 0.5 })}
          exitTransition={ExitTransition.scaleOut({ targetScale: 0.5 })}
        />

        <TransitionSection
          title="Expand / Shrink - the only transition that affects layout"
          label="Expand Vertically"
          color="#E91E63"
          enterTransition={EnterTransition.expandVertically()}
          exitTransition={ExitTransition.shrinkVertically()}
        />

        <TransitionSection
          title="Combined"
          label="Fade + Slide"
          color="#3F51B5"
          enterTransition={EnterTransition.fadeIn().plus(
            EnterTransition.slideInHorizontally({ initialOffsetX: -1.0 })
          )}
          exitTransition={ExitTransition.fadeOut().plus(
            ExitTransition.slideOutHorizontally({ targetOffsetX: 1.0 })
          )}
        />
      </ScrollView>
    </Page>
  );
}

AnimatedVisibilityScreen.navigationOptions = {
  title: 'AnimatedVisibility',
};
