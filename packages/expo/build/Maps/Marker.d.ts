import * as React from 'react';
declare type Props = {
    description: string | null;
    title: string;
    coordinate: {
        latitude: number;
        longitude: number;
    };
};
declare class Marker extends React.Component<Props> {
    render(): JSX.Element;
}
export default Marker;
