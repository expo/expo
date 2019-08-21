//
//  GTMDebugThreadValidation.h
//
//  Copyright 2016 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

#import "GTMDefines.h"
#import <Foundation/Foundation.h>

// GTMCheckCurrentQueue, GTMIsCurrentQueue
//
// GTMCheckCurrentQueue takes a target queue and uses _GTMDevAssert to
// report if that is not the currently executing queue.
//
// GTMIsCurrentQueue takes a target queue and returns true if the target queue
// is the currently executing dispatch queue. This can be passed to another
// assertion call in debug builds; it should never be used in release code.
//
// The dispatch queue must have a label.
#define GTMCheckCurrentQueue(targetQueue)                    \
  _GTMDevAssert(GTMIsCurrentQueue(targetQueue),              \
                @"Current queue is %s (expected %s)",        \
                _GTMQueueName(DISPATCH_CURRENT_QUEUE_LABEL), \
                _GTMQueueName(targetQueue))

#define GTMIsCurrentQueue(targetQueue)                 \
  (strcmp(_GTMQueueName(DISPATCH_CURRENT_QUEUE_LABEL), \
          _GTMQueueName(targetQueue)) == 0)

#define _GTMQueueName(queue)                     \
  (strlen(dispatch_queue_get_label(queue)) > 0 ? \
    dispatch_queue_get_label(queue) : "unnamed")
