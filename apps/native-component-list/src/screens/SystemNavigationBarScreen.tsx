import * as SystemNavigationBar from 'expo-system-navigation-bar';
import * as React from 'react';
import { Button } from 'react-native';

import { Page, Section } from '../components/Page';

export default function SystemNavigationBarScreen() {
    return (
        <Page>
            <Section title="System UI Visibility">
                <SetNavigationBarVisibilityExample />
            </Section>
            <Section title="Status Bar Color">
                <SetStatusBarColorExample />
            </Section>
            <Section title="Navigation Bar Color">
                <SetNavigationBarColorExample />
            </Section>
            <Section title="Navigation Bar Divider Color">
                <SetNavigationBarDividerColorExample />
            </Section>
            <Section title="Edge-to-edge mode example">
                <EdgeToEdgeModeExample />
            </Section>
            {/* <Section title="Appearance">
        <SetAppearanceExample />
      </Section> */}
        </Page>
    );
}

SystemNavigationBarScreen.navigationOptions = {
    title: 'System Navigation Bar',
};

function SetNavigationBarVisibilityExample() {
    const [statusBarVisibility, setStatusBarVisibility] = React.useState<'visible' | 'hidden'>(
        'visible'
    );
    const [navigationBarVisibility, setNavigationBarVisibility] = React.useState<
        'visible' | 'hidden'
    >('visible');

    const toggleNavigationBar = React.useCallback(() => {
        setNavigationBarVisibility((currentValue) => {
            const newValue = currentValue === 'visible' ? 'hidden' : 'visible';
            SystemNavigationBar.setNavigationBarVisibility(newValue);
            return newValue;
        });
    }, []);
    const toggleStatusBar = React.useCallback(() => {
        setStatusBarVisibility((currentValue) => {
            const newValue = currentValue === 'visible' ? 'hidden' : 'visible';
            SystemNavigationBar.setStatusBarVisibility(newValue);
            return newValue;
        });
    }, []);

    return (
        <>
            <Button
                onPress={toggleNavigationBar}
                title={navigationBarVisibility === 'hidden' ? 'Show Navigation Bar' : 'Hide Navigation Bar'}
            />
            <Button
                onPress={toggleStatusBar}
                title={statusBarVisibility === 'hidden' ? 'Show Status Bar' : 'Hide Status Bar'}
            />
        </>
    );
}

function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function SetNavigationBarColorExample() {
    const [style, setStyle] = React.useState<'light' | 'dark'>('light');
    const nextStyle = style === 'light' ? 'dark' : 'light';
    return (
        <>
            <Button
                onPress={() => {
                    SystemNavigationBar.setNavigationBarBackgroundColor(getRandomColor());
                }}
                title="Set Navigation Bar to random color"
            />
            <Button
                onPress={() => {
                    SystemNavigationBar.setNavigationBarForegroundStyle(nextStyle);
                    setStyle(nextStyle);
                }}
                title={`Set Navigation Bar Style to ${nextStyle}`}
            />
        </>
    );
}

function SetNavigationBarDividerColorExample() {
    return (
        <>
            <Button
                onPress={() => {
                    SystemNavigationBar.setNavigationBarDividerColor(getRandomColor());
                }}
                title="Set Navigation Bar Divider to random color"
            />
        </>
    );
}

function SetStatusBarColorExample() {
    const [style, setStyle] = React.useState<'light' | 'dark'>('light');
    const nextStyle = style === 'light' ? 'dark' : 'light';
    return (
        <>
            <Button
                onPress={() => {
                    SystemNavigationBar.setStatusBarBackgroundColor(getRandomColor());
                }}
                title="Set Status Bar to random color"
            />
            <Button
                onPress={() => {
                    SystemNavigationBar.setStatusBarForegroundStyle(nextStyle);
                    setStyle(nextStyle);
                }}
                title={`Set Status Bar Style to ${nextStyle}`}
            />
        </>
    );
}

const SystemNavigationBarBehaviors: SystemNavigationBar.SystemNavigationBarBehavior[] = [
    'inset-swipe',
    'inset-touch',
    'overlay-swipe',
];

function EdgeToEdgeModeExample() {
    const [isEdgeToEdge, setIsEdgeToEdge] = React.useState(false);
    const [SystemNavigationBarBehavior, setSystemNavigationBarBehavior] =
        React.useState<SystemNavigationBar.SystemNavigationBarBehavior>('inset-swipe');

    const onPress = React.useCallback(() => {
        setIsEdgeToEdge((is) => {
            const newValue = !is;
            SystemNavigationBar.setNavigationBarBackgroundColor(newValue ? '#ff000000' : '#ff0000ff');
            SystemNavigationBar.setStatusBarBackgroundColor(newValue ? '#ff000000' : '#ff0000ff');
            SystemNavigationBar.setDrawsBehindSystemNavigationBar(newValue);
            return newValue;
        });
    }, []);

    const nextSystemNavigationBarBehavior = React.useMemo(() => {
        const index = SystemNavigationBarBehaviors.indexOf(SystemNavigationBarBehavior);
        const newIndex = (index + 1) % SystemNavigationBarBehaviors.length;
        return SystemNavigationBarBehaviors[newIndex];
    }, [SystemNavigationBarBehavior]);

    const onPressBehavior = React.useCallback(() => {
        SystemNavigationBar.setSystemNavigationBarBehavior(nextSystemNavigationBarBehavior);
        setSystemNavigationBarBehavior(nextSystemNavigationBarBehavior);
    }, [nextSystemNavigationBarBehavior]);

    return (
        <>
            <Button
                onPress={onPress}
                title={`${isEdgeToEdge ? 'Disable' : 'Enable'} Edge-to-Edge Mode`}
            />
            <Button
                onPress={onPressBehavior}
                title={`Set System UI behavior to ${nextSystemNavigationBarBehavior}`}
            />
        </>
    );
}

// const appearances: Appearance[] = ['light', 'dark', 'auto', 'unspecified'];

// function SetAppearanceExample() {
//   const [appearance, setAppearance] = React.useState<Appearance>(appearances[0]);

//   const nextValue = React.useMemo(() => {
//     const index = appearances.indexOf(appearance);
//     const newValue = appearances[(index + 1) % appearances.length];
//     return newValue;
//   }, [appearance]);
//   const onPress = React.useCallback(() => {
//     // TODO: Implement SystemNavigationBar.setAppearance(nextValue);
//     setAppearance(nextValue);
//   }, [nextValue]);

//   return (
//     <>
//       <Button onPress={onPress} title={`Set Appearance to ${nextValue}`} />
//     </>
//   );
// }
