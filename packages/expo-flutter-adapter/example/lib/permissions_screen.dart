import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:expo_permissions/expo_permissions.dart';

class PermissionsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("Permissions Unimodule Demo"),
        ),
        body: SingleChildScrollView(
            child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height,
                ),
                child: Center(
                  child: Column(
                    children: <Widget>[
                      Permission(permissionType: PermissionType.audioRecording),
                      Permission(permissionType: PermissionType.camera),
                      Permission(permissionType: PermissionType.calendar),
                      Permission(permissionType: PermissionType.cameraRoll),
                      Permission(permissionType: PermissionType.contacts),
                      Permission(permissionType: PermissionType.location),
                      Permission(permissionType: PermissionType.reminders),
                      Permission(
                          permissionType:
                              PermissionType.userFacingNotifications),
                    ],
                  ),
                ))));
  }
}

class Permission extends StatefulWidget {
  Permission({Key key, this.permissionType}) : super(key: key);

  final PermissionType permissionType;

  @override
  _PermissionState createState() {
    return _PermissionState();
  }
}

class _PermissionState extends State<Permission> {
  bool isGranted = false;

  void _checkStatus(PermissionResponse response) {
    Map pr = response.get(widget.permissionType);
    if (pr['status'] == 'granted') {
      setState(() => isGranted = true);
    }
  }

  void _handleAskButtonPress() {
    Permissions.ask([widget.permissionType]).then(_checkStatus);
  }

  @override
  void initState() {
    super.initState();
    Permissions.get([widget.permissionType]).then(_checkStatus);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text("${widget.permissionType.toString()} permission - "),
            isGranted
                ? Text(
                    "granted",
                    style: TextStyle(
                        color: Colors.green, fontWeight: FontWeight.bold),
                  )
                : Text(
                    "undetermined || denied",
                    style: TextStyle(
                        color: Colors.red, fontWeight: FontWeight.bold),
                  )
          ],
        ),
        RaisedButton(
          child: Text("Ask for ${widget.permissionType.toString()} permission"),
          onPressed: _handleAskButtonPress,
        )
      ],
    );
  }
}
