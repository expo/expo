'use client';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { getDefaultHeaderHeight, Header, HeaderBackButton, HeaderTitle, } from '../../../elements';
import { useLocale } from '../../../native';
export function HeaderSegment(props) {
    const { direction } = useLocale();
    const [leftLabelLayout, setLeftLabelLayout] = React.useState(undefined);
    const [titleLayout, setTitleLayout] = React.useState(undefined);
    const handleTitleLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        setTitleLayout((titleLayout) => {
            if (titleLayout && height === titleLayout.height && width === titleLayout.width) {
                return titleLayout;
            }
            return { height, width };
        });
    };
    const handleLeftLabelLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        if (leftLabelLayout && height === leftLabelLayout.height && width === leftLabelLayout.width) {
            return;
        }
        setLeftLabelLayout({ height, width });
    };
    const { progress, layout, modal, onGoBack, backHref, headerTitle: title, headerLeft: left = onGoBack
        ? (props) => <HeaderBackButton {...props}/>
        : undefined, headerRight: right, headerBackImage, headerBackTitle, headerBackButtonDisplayMode = Platform.OS === 'ios' ? 'default' : 'minimal', headerBackTruncatedTitle, headerBackAccessibilityLabel, headerBackTestID, headerBackAllowFontScaling, headerBackTitleStyle, headerTitleContainerStyle, headerLeftContainerStyle, headerRightContainerStyle, headerBackgroundContainerStyle, headerStyle: customHeaderStyle, headerStatusBarHeight, styleInterpolator, ...rest } = props;
    const defaultHeight = getDefaultHeaderHeight(layout, modal, headerStatusBarHeight);
    const { height = defaultHeight } = StyleSheet.flatten(customHeaderStyle || {});
    const headerHeight = typeof height === 'number' ? height : defaultHeight;
    const { titleStyle, leftButtonStyle, leftLabelStyle, rightButtonStyle, backgroundStyle } = React.useMemo(() => styleInterpolator({
        current: { progress: progress.current },
        next: progress.next && { progress: progress.next },
        direction,
        layouts: {
            header: {
                height: headerHeight,
                width: layout.width,
            },
            screen: layout,
            title: titleLayout,
            leftLabel: leftLabelLayout,
        },
    }), [styleInterpolator, progress, direction, headerHeight, layout, titleLayout, leftLabelLayout]);
    const headerLeft = left
        ? (props) => left({
            ...props,
            href: backHref,
            backImage: headerBackImage,
            accessibilityLabel: headerBackAccessibilityLabel,
            testID: headerBackTestID,
            allowFontScaling: headerBackAllowFontScaling,
            onPress: onGoBack,
            label: headerBackTitle,
            truncatedLabel: headerBackTruncatedTitle,
            labelStyle: [leftLabelStyle, headerBackTitleStyle],
            onLabelLayout: handleLeftLabelLayout,
            screenLayout: layout,
            titleLayout,
            canGoBack: Boolean(onGoBack),
        })
        : undefined;
    const headerRight = right
        ? (props) => right({
            ...props,
            canGoBack: Boolean(onGoBack),
        })
        : undefined;
    const headerTitle = typeof title !== 'function'
        ? (props) => <HeaderTitle {...props} onLayout={handleTitleLayout}/>
        : (props) => title({ ...props, onLayout: handleTitleLayout });
    return (<Header modal={modal} layout={layout} headerTitle={headerTitle} headerLeft={headerLeft} headerRight={headerRight} headerTitleContainerStyle={[titleStyle, headerTitleContainerStyle]} headerLeftContainerStyle={[leftButtonStyle, headerLeftContainerStyle]} headerRightContainerStyle={[rightButtonStyle, headerRightContainerStyle]} headerBackButtonDisplayMode={headerBackButtonDisplayMode} headerBackgroundContainerStyle={[backgroundStyle, headerBackgroundContainerStyle]} headerStyle={customHeaderStyle} headerStatusBarHeight={headerStatusBarHeight} {...rest}/>);
}
//# sourceMappingURL=HeaderSegment.js.map