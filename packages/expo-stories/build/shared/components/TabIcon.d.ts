import React from 'react';
interface Props {
    name: string;
    focused?: boolean;
    size?: number;
}
export default class TabIcon extends React.PureComponent<Props> {
    render(): JSX.Element;
}
export {};
