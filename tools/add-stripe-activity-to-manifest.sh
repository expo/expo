#!/usr/bin/env bash
# example of use
# ./add-stripe-activity-to-manifest.sh AndroidManifest.xml abi30_0_0
MANIFEST_PATH=$1
ABI_VERSION=$2
sed 's/$PREFIX/'$ABI_VERSION'/g' < template-stripe-activity.xml > tempFileStripe.txt
sed '/<!-- Versioned Activity for Stripe -->/r tempFileStripe.txt' $MANIFEST_PATH
rm tempFileStripe.txt
