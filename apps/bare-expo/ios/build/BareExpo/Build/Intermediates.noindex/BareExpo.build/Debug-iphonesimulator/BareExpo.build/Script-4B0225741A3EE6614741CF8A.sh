#!/bin/sh
diff "${PODS_PODFILE_DIR_PATH}/Podfile.lock" "${PODS_ROOT}/Manifest.lock" > /dev/null
if [ $? != 0 ] ; then
    # print error to STDERR
    echo "error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation." >&2
    exit 1
fi
# This output is used by Xcode 'outputs' to avoid re-running this script phase.
echo "SUCCESS" > "${SCRIPT_OUTPUT_FILE_0}"

