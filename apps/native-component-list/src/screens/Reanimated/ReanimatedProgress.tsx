import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';

interface State {
  perc: number;
}

export default class Example extends React.Component {
  static navigationOptions = {
    title: 'Progress bar using reanimated',
  };

  readonly state: State = {
    perc: 0,
  };
  ref?: any = React.createRef();

  render() {
    const transition = <Transition.Change interpolation="easeInOut" durationMs={400} />;

    const { perc } = this.state;

    return (
      <Transitioning.View ref={this.ref} style={styles.centerAll} transition={transition}>
        <Button
          title={perc + 20 <= 100 ? '+20%' : '-80%'}
          color="#FF5252"
          onPress={() => {
            this.ref.current.animateNextTransition();
            this.setState({ perc: perc + 20 <= 100 ? perc + 20 : 20 });
          }}
        />
        <View style={styles.bar}>
          <View style={{ height: 5, width: `${perc}%`, backgroundColor: '#FF5252' }} />
        </View>
      </Transitioning.View>
    );
  }
}

const styles = StyleSheet.create({
  centerAll: {
    alignItems: 'center',
    marginBottom: 10,
  },
  bar: {
    marginTop: 10,
    height: 5,
    width: '80%',
    backgroundColor: '#aaa',
  },
});
