#!/usr/bin/env bash
# example of use
# ./add-stripe-activity-to-manifest.sh AndroidManifest.xml 30_0_0
MANIFEST_PATH=$1
ABI_VERSION_NUMBER=$2
sed 's/$ABI_VERSION_NUMBER/abi'$ABI_VERSION_NUMBER'/g' < template-stripe-activity.xml > tempFileStripe.txt
sed 's/$'
sed -i '' '/<!-- Versioned Activity for Stripe -->/r tempFileStripe.txt' $MANIFEST_PATH
rm tempFileStripe.txt
