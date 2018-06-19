import 'package:flutter/material.dart';

import 'package:expo_permissions/permissions.dart';
import 'package:expo_contacts/contacts.dart';
import 'package:expo_sensors/accelerometer.dart';

// Test app

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Expo Modules Test Suite',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: MyHomePage(title: 'Expo Modules Test Suite Home'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key key, this.title}) : super(key: key);

  final String title;

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    (() async {
      // Contacts
      await Permissions.ask(PermissionType.contacts);
      final info = await Contacts.getContacts();
      print('`Contacts.getContactsAsync(...)`: ${info.data.first.name}');

      // Accelerometer
      Accelerometer.events.listen((AccelerometerEvent e) =>
          print('`AccelerometerEvent(${e.x}, ${e.y}, ${e.z})`'));
    })();

    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.display1,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: Icon(Icons.add),
      ),
    );
  }
}
