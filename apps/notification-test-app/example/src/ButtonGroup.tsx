import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';

export default class ButtonGroup extends React.Component {

  constructor(props) {
    super(props);  
  }

  render() {
      let buttonList = [];
      this.props.buttonList.forEach((element, i) => {
          buttonList.push(
            <View style={styles.button} key={i} >
              <Button
                title={element.title}
                onPress={element.onPush.bind(element)} >
              </Button>
            </View>
          );
      });

    return (
      <View style={styles.container} >
        <Text style={styles.header} > 
          {this.props.title}
        </Text>
        { buttonList }
      </View>
    );
  }

}

const styles = StyleSheet.create({
    container: {
        margin: 5,
        backgroundColor: 'orange',
        padding: 3,
    },
    button: {
      margin: 3,
      padding: 3,
      backgroundColor: 'yellow',
    },
    header: {
      fontSize:16,
      fontWeight: 'bold',
      color: 'grey',
    },
});
