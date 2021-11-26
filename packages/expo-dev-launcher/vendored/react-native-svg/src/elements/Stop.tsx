import { Component } from 'react';

type StopProps = {
  parent?: Component;
};

export default class Stop extends Component<StopProps, {}> {
  props!: StopProps;
  static displayName = 'Stop';

  setNativeProps = () => {
    const { parent } = this.props;
    if (parent) {
      parent.forceUpdate();
    }
  };

  render() {
    return null;
  }
}
