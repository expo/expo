'use client';
import { Box } from '@expo/ui/jetpack-compose';
import { width } from '@expo/ui/jetpack-compose/modifiers';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
export const NativeToolbarSpacer = (props) => {
    if (!props.width) {
        return null;
    }
    return (<AnimatedItemContainer visible={!props.hidden}>
      <Box modifiers={[width(props.width)]}/>
    </AnimatedItemContainer>);
};
//# sourceMappingURL=native.android.js.map