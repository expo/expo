#!/bin/sh

#  run
#
#  Copyright (c) 2015 Crashlytics. All rights reserved.

#  Figure out where we're being called from
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

#  Quote path in case of spaces or special chars
DIR="\"${DIR}"

PATH_SEP="/"
VALIDATE_COMMAND="uploadDSYM\" $@ validate run-script"
UPLOAD_COMMAND="uploadDSYM\" $@ run-script"

#  Ensure params are as expected, run in sync mode to validate
eval $DIR$PATH_SEP$VALIDATE_COMMAND
return_code=$?

if [[ $return_code != 0 ]]; then
  exit $return_code
fi

#  Verification passed, upload dSYM in background to prevent Xcode from waiting
#  Note: Validation is performed again before upload.
#  Output can still be found in Console.app
eval $DIR$PATH_SEP$UPLOAD_COMMAND > /dev/null 2>&1 &
