import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Platform,
  Button,
} from 'react-native';
import {
  connectAsync,
  getProductsAsync,
  getPurchaseHistoryAsync,
  purchaseItemAsync,
  getBillingResponseCodeAsync,
  finishTransactionAsync,
  disconnectAsync,
  ResponseCode,
  onPurchase,
  ErrorCode,
} from 'expo-in-app-purchases';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      items: [],
      history: [],
    };
    this.queryPurchaseHistory = this.queryPurchaseHistory.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.renderHistoryRecord = this.renderHistoryRecord.bind(this);
  }

  async componentDidMount() {
    const history = await connectAsync();

    const items = Platform.select({
      ios: [
        'dev.expo.products.premium',
        'dev.expo.payments.updates',
        'dev.expo.payments.adfree',
        'dev.expo.payments.gold',
      ],
      android: ['gas', 'premium', 'gold_yearly', 'gold_monthly'],
    });
    const { responseCode, results } = await getProductsAsync(items);
    if (responseCode === ResponseCode.OK) {
      this.setState({ items: results, history: history.results });
    }

    onPurchase(({ responseCode, results, errorCode }) => {
      if (responseCode === ResponseCode.OK) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            finishTransactionAsync(purchase.purchaseToken, true);
          }
        }
      } else if (responseCode === ResponseCode.USER_CANCELED) {
        console.log('Why did you cancel?? 😠');
      } else {
        console.warn(
          `Something went wrong with the purchase. Received response code ${responseCode} and errorCode ${errorCode}`
        );
      }
    });
  }

  async componentWillUnmount() {
    await disconnectAsync();
  }

  async queryPurchaseHistory() {
    const { responseCode, results } = await getPurchaseHistoryAsync(false);
    if (responseCode === ResponseCode.OK) {
      this.setState({ history: results });
    }
  }

  renderItem(item) {
    return (
      <View key={item.productId}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text>Description: {item.description}</Text>
        <Text>Price: {item.price}</Text>
        <Text>Currency Code: {item.priceCurrencyCode}</Text>
        <Text>Price Amount Micros: {item.priceAmountMicros}</Text>
        <Text>Product ID: {item.productId}</Text>
        <Text>Type: {item.type}</Text>
        <Text>Subscription Period: {item.subscriptionPeriod}</Text>
        {Platform.OS === 'android' ? <Text>SKU Details Token: {item.skuDetailsToken}</Text> : null}
        <View style={styles.buttonContainer}>
          <Button title="Buy" onPress={() => purchaseItemAsync(item.productId)} />
        </View>
      </View>
    );
  }

  renderHistoryRecord(record) {
    return (
      <View key={record.purchaseToken}>
        <Text style={styles.itemTitle}>Product ID: {record.productId}</Text>
        <Text>Purchase Token: {record.purchaseToken}</Text>
        <Text>Acknowledged: {record.acknowledged ? 'True' : 'False'}</Text>
        <Text>Purchase State: {record.purchaseState}</Text>
        <Text>Purchase Time: {record.purchaseTime}</Text>
        {Platform.OS === 'android' ? <Text>Package Name: {record.packageName}</Text> : null}
        {Platform.OS === 'android' ? <Text>Order ID: {record.orderId}</Text> : null}
      </View>
    );
  }

  async getBillingResult() {
    const responseCode = await getBillingResponseCodeAsync();
    console.log(`Got response code: ${responseCode}`);
  }

  render() {
    return (
      <ScrollView>
        <SafeAreaView style={styles.container}>
          <Text style={styles.titleText}>In App Store</Text>
        </SafeAreaView>
        {this.state.items.map(item => this.renderItem(item))}
        <Text style={styles.itemTitle}>History</Text>
        <View style={styles.buttonContainer}>
          <Button title="Query History" onPress={this.queryPurchaseHistory} />
        </View>
        {this.state.history.map(historyRecord => this.renderHistoryRecord(historyRecord))}
        <View style={styles.buttonContainer}>
          <Button title="Log Response Code" onPress={this.getBillingResult} />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
