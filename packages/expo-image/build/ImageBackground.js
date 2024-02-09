import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from './Image';
export class ImageBackground extends React.PureComponent {
    render() {
        const { style, imageStyle, children, ...props } = this.props;
        return (<View style={style}>
        <Image {...props} style={[StyleSheet.absoluteFill, imageStyle]}/>
        {children}
      </View>);
    }
}
//# sourceMappingURL=ImageBackground.js.map