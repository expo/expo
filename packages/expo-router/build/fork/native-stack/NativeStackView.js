import { NativeStackView as RNNativeStackView } from '@react-navigation/native-stack';
import { useContext, useMemo } from 'react';
import { RootModalContext, RootModalProvider } from '../../layouts/RootModal';
export function NativeStackView(props) {
    return (<RootModalProvider>
      <NativeStackViewInner {...props}/>
    </RootModalProvider>);
}
function NativeStackViewInner(props) {
    const rootModals = useContext(RootModalContext);
    // Append the root modals to the state
    const state = useMemo(() => {
        if (rootModals.routes.length === 0) {
            return props.state;
        }
        return {
            ...props.state,
            routes: props.state.routes.concat(rootModals.routes),
        };
    }, [props.state, rootModals.routes]);
    return <RNNativeStackView {...props} state={state}/>;
}
//# sourceMappingURL=NativeStackView.js.map