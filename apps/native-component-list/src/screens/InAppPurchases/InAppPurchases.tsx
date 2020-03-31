import {
  connectAsync,
  disconnectAsync,
  finishTransactionAsync,
  getBillingResponseCodeAsync,
  getProductsAsync,
  getPurchaseHistoryAsync,
  IAPResponseCode,
  purchaseItemAsync,
  setPurchaseListener,
} from 'expo-in-app-purchases';
import React from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default class InAppPurchases extends React.Component<any, any> {
  static navigationOptions = {
    title: 'In-App Purchases',
  };

  state = {
    items: [],
    history: [],
    responseCode: 0,
  };

  async componentDidMount() {
    // This method must be called first to initialize listeners and billing client
    const history = await connectAsync();

    /*
      These item entries are created in App Store Connect and Google Play Console respectively.
      If you want to add more or edit their attributes you can do so there.
    */
    const items = Platform.select({
      ios: [
        'dev.expo.products.premium',
        'dev.expo.payments.updates',
        'dev.expo.payments.adfree',
        'dev.expo.payments.gold',
      ],
      android: ['gas', 'premium', 'gold_yearly', 'gold_monthly'],
    });

    // Get product details
    const { responseCode, results } = await getProductsAsync(items);
    if (responseCode === IAPResponseCode.OK) {
      this.setState({ items: results, history: history.results });
    }

    // Set purchase listener
    setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === IAPResponseCode.OK) {
        for (const purchase of results) {
          console.log(`Successfully purchased ${purchase.productId}`);
          if (!purchase.acknowledged) {
            finishTransactionAsync(purchase, true);
          }
        }
      } else if (responseCode === IAPResponseCode.USER_CANCELED) {
        console.log('User canceled');
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
    const { responseCode, results } = await getPurchaseHistoryAsync(true);
    if (responseCode === IAPResponseCode.OK) {
      this.setState({ history: results });
    }
  }

  renderItem(item: any) {
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
        <View style={styles.buttonContainer}>
          <Button title="Buy" onPress={() => purchaseItemAsync(item.productId)} />
        </View>
      </View>
    );
  }

  renderHistoryRecord(record: any) {
    const key = Platform.OS === 'android' ? record.purchaseToken : record.orderId;
    return (
      <View key={key}>
        <Text style={styles.itemTitle}>Product ID: {record.productId}</Text>
        <Text>Acknowledged: {record.acknowledged ? 'True' : 'False'}</Text>
        <Text>Purchase State: {record.purchaseState}</Text>
        <Text>Purchase Time: {record.purchaseTime}</Text>
        <Text>Order ID: {record.orderId}</Text>
        {Platform.OS === 'android' ? <Text>Purchase Token: {record.purchaseToken}</Text> : null}
        {Platform.OS === 'android' ? <Text>Package Name: {record.packageName}</Text> : null}
        {Platform.OS === 'ios' ? <Text>Original Order ID: {record.originalOrderId}</Text> : null}
        {Platform.OS === 'ios' ? (
          <Text>Original Purchase Time: {record.originalPurchaseTime}</Text>
        ) : null}
      </View>
    );
  }

  async getBillingResult() {
    const responseCode = await getBillingResponseCodeAsync();
    this.setState({ responseCode });
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
          <Button title="Query History" onPress={() => this.queryPurchaseHistory()} />
        </View>
        {this.state.history.map(historyRecord => this.renderHistoryRecord(historyRecord))}
        <View style={styles.buttonContainer}>
          <Button title="Update Response Code" onPress={() => this.getBillingResult()} />
        </View>
        <View style={styles.container}>
          <Text style={styles.itemTitle}>{this.state.responseCode}</Text>
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
