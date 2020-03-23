import React from 'react';
import ExpoImage from './ExpoImage';
export default class Image extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            onLoad: undefined,
            onError: undefined,
        };
    }
    static getDerivedStateFromProps(props) {
        return {
            onLoad: props.onLoadEnd
                ? e => {
                    if (props.onLoad) {
                        props.onLoad(e);
                    }
                    props.onLoadEnd();
                }
                : props.onLoad,
            onError: props.onLoadEnd
                ? e => {
                    if (props.onError) {
                        props.onError(e);
                    }
                    props.onLoadEnd();
                }
                : props.onError,
        };
    }
    render() {
        return <ExpoImage {...this.props} onLoad={this.state.onLoad} onError={this.state.onError}/>;
    }
}
//# sourceMappingURL=Image.js.map