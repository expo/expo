#!/bin/bash

adb shell am broadcast -a com.android.vending.INSTALL_REFERRER -n host.exp.exponent/.referrer.InstallReferrerReceiver --es "referrer" "listbeta"
