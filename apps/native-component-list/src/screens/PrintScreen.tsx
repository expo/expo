import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  selectedPrinter?: Print.Printer;
}

export default class PrintScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Print',
  };

  readonly state: State = {};

  render() {
    return (
      <ScrollView style={{ padding: 8 }}>
        {Platform.OS === 'ios' && this._renderSelectPrinter()}
        <ListButton
          onPress={this._printHTMLPortraitAsync}
          style={styles.button}
          title="Print HTML"
        />
        <ListButton
          onPress={this._printHTMLLandscapeAsync}
          style={styles.button}
          title="Print HTML (Landscape)"
        />
        <ListButton
          onPress={this._printDocumentPickerPDFAsync}
          style={styles.button}
          title="Print PDF (document picker)"
        />
        <ListButton
          onPress={this._printDataURIPDFAsync}
          style={styles.button}
          title="Print PDF (data URI)"
        />
        <ListButton
          onPress={this._printHTMLToPDF}
          style={styles.button}
          title="Print HTML to PDF"
        />
      </ScrollView>
    );
  }

  _renderSelectPrinter() {
    const { selectedPrinter } = this.state;

    return (
      <View>
        <ListButton
          onPress={this._selectPrinterAsync}
          style={styles.button}
          title="Select Printer (iOS only)"
        />
        <Text style={styles.text}>
          Selected printer: {selectedPrinter ? selectedPrinter.name : 'None'}
        </Text>
      </View>
    );
  }

  _selectPrinterAsync = async () => {
    try {
      const selectedPrinter = await Print.selectPrinterAsync();
      this.setState({ selectedPrinter });
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };

  _printHTMLAsync = async (orientation: string = Print.Orientation.portrait) => {
    const { selectedPrinter } = this.state;

    try {
      await Print.printAsync({
        html: 'Dear Friend! <b>Happy</b> Birthday, enjoy your day! 🎈',
        printerUrl: selectedPrinter && selectedPrinter.url,
        orientation,
      });
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };

  _printHTMLPortraitAsync = async () => {
    return this._printHTMLAsync(Print.Orientation.portrait);
  };

  _printHTMLLandscapeAsync = async () => {
    return this._printHTMLAsync(Print.Orientation.landscape);
  };

  _printDocumentPickerPDFAsync = async () => {
    const { selectedPrinter } = this.state;

    try {
      const results = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });
      const document = results.assets?.[0];
      if (results.canceled || !document) {
        throw new Error('User did not select a document');
      }
      await Print.printAsync({
        uri: document.uri,
        printerUrl: selectedPrinter ? selectedPrinter.url : undefined,
      });
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };

  _printDataURIPDFAsync = async () => {
    const { selectedPrinter } = this.state;

    try {
      await Print.printAsync({
        uri: PDF_DATA_URI,
        printerUrl: selectedPrinter ? selectedPrinter.url : undefined,
      });
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };

  _printHTMLToPDF = async () => {
    try {
      const pdf = await Print.printToFileAsync({
        html: `<!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
              <style>
                @page { 
                  margin: 50px;
                }
                h1 {
                  font-size: 50px;
                  font-family: Helvetica Neue;
                  font-weight: normal;
                }
                h2 {
                  font-size: 50px;
                  break-inside: avoid;
                }
              </style>
            </head>
            <body style="text-align: center;">
              <h1>Hello Expo!</h1>
              <img
                src="https://d30j33t1r58ioz.cloudfront.net/static/guides/sdk.png"
                style="width: 90vw;" />
              ${new Array(9)
                .fill(0)
                .map(() => `<h2>This wraps to the next line when it's too long</h2>`)}
            </body>
          </html>
        `,
        margins: {
          left: 50,
          top: 50,
          right: 50,
          bottom: 50,
        },
      });

      Alert.alert('Successfully printed to PDF', 'Do you want to print this file to the printer?', [
        {
          text: 'No',
          onPress: () => {},
        },
        {
          text: 'Yes',
          onPress: () => {
            Print.printAsync({
              uri: pdf.uri,
            });
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Something went wrong: ', e.message);
    }
  };
}

const styles = StyleSheet.create({
  button: {},
  text: {
    padding: 8,
  },
});

const PDF_DATA_URI =
  'data:application/pdf;base64,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zytGtEbqR61Hz4z5jN16sfTF8MuMl9Pjhb8p/rb3ldGrn353+71nYsnE8GvR65k/St6ovjn61vZt52To5NN3ae+mp4req74/9oH9oftj9MeR6exP+E+Vn40/d3wJ/PJ4Jm1m5t/3hPP7CmVuZHN0cmVhbQplbmRvYmoKOSAwIG9iagoyNjEyCmVuZG9iago3IDAgb2JqClsgL0lDQ0Jhc2VkIDggMCBSIF0KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9NZWRpYUJveCBbMCAwIDU5NS4yNzU2IDg0MS44ODk4XSAvQ291bnQgMSAvS2lkcyBbIDIgMCBSIF0KPj4KZW5kb2JqCjEwIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAzIDAgUiA+PgplbmRvYmoKMTEgMCBvYmoKKCkKZW5kb2JqCjEyIDAgb2JqCihNYWMgT1MgWCAxMC4xMy4zIFF1YXJ0eiBQREZDb250ZXh0KQplbmRvYmoKMTMgMCBvYmoKKCkKZW5kb2JqCjE0IDAgb2JqCigpCmVuZG9iagoxNSAwIG9iagooU2FmYXJpKQplbmRvYmoKMTYgMCBvYmoKKEQ6MjAxODAyMTUxOTQ4MTNaMDAnMDAnKQplbmRvYmoKMTcgMCBvYmoKKCkKZW5kb2JqCjE4IDAgb2JqClsgKCkgXQplbmRvYmoKMSAwIG9iago8PCAvVGl0bGUgMTEgMCBSIC9BdXRob3IgMTMgMCBSIC9TdWJqZWN0IDE0IDAgUiAvUHJvZHVjZXIgMTIgMCBSIC9DcmVhdG9yCjE1IDAgUiAvQ3JlYXRpb25EYXRlIDE2IDAgUiAvTW9kRGF0ZSAxNiAwIFIgL0tleXdvcmRzIDE3IDAgUiAvQUFQTDpLZXl3b3JkcwoxOCAwIFIgPj4KZW5kb2JqCnhyZWYKMCAxOQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDUwNDAgMDAwMDAgbiAKMDAwMDAwMTcyOCAwMDAwMCBuIAowMDAwMDA0Njc4IDAwMDAwIG4gCjAwMDAwMDAwMjIgMDAwMDAgbiAKMDAwMDAwMTcwOCAwMDAwMCBuIAowMDAwMDAxODQyIDAwMDAwIG4gCjAwMDAwMDQ2NDMgMDAwMDAgbiAKMDAwMDAwMTkxMCAwMDAwMCBuIAowMDAwMDA0NjIzIDAwMDAwIG4gCjAwMDAwMDQ3NzEgMDAwMDAgbiAKMDAwMDAwNDgyMSAwMDAwMCBuIAowMDAwMDA0ODQwIDAwMDAwIG4gCjAwMDAwMDQ4OTMgMDAwMDAgbiAKMDAwMDAwNDkxMiAwMDAwMCBuIAowMDAwMDA0OTMxIDAwMDAwIG4gCjAwMDAwMDQ5NTYgMDAwMDAgbiAKMDAwMDAwNDk5OCAwMDAwMCBuIAowMDAwMDA1MDE3IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgMTkgL1Jvb3QgMTAgMCBSIC9JbmZvIDEgMCBSIC9JRCBbIDw5MDBjZTYxZDUwNmE1NTg0MjFmZWFkNTM1ZjM0MTE1Zj4KPDkwMGNlNjFkNTA2YTU1ODQyMWZlYWQ1MzVmMzQxMTVmPiBdID4+CnN0YXJ0eHJlZgo1MjE1CiUlRU9GCg==';
