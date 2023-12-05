import type { Protocol } from 'devtools-protocol';

import {
  CdpMessage,
  DebuggerMetadata,
  DebuggerRequest,
  DebuggerResponse,
  DeviceRequest,
  DeviceResponse,
  InspectorHandler,
} from './types';
import { respond, send } from './utils';

export class PageFrameHandler implements InspectorHandler {
  frameId = 'generatedframeid';
  sentPageEnable = false;

  get frameAuxData() {
    return {
      isDefault: true,
      type: 'default',
      frameId: this.frameId,
    };
  }

  // onDebuggerMessage(
  //   message: DebuggerRequest<>,
  //   { socket }: DebuggerMetadata
  // ) {


  //   return false;
  // }

  onDeviceMessage(
    message: DeviceRequest<DebuggerScriptParsed> | DeviceRequest<RuntimeExecutionContextCreated>,
    { socket }: DebuggerMetadata
  ) {
    // Send `Page.enable` once
    if (!this.sentPageEnable) {
      this.sentPageEnable = true;
      console.log('Page.enable sent');
      send<DeviceRequest<{}>>(socket, {
        method: 'Page.enable',
        params: {},
      });
    }

    // Once a `Debugger.scriptParsed` event is received, we should emit the `Page.frame*Loading` events.
    if (message.method === 'Debugger.scriptParsed') {
      console.log('Page.frameStartedLoading sent');
      send<DeviceRequest<PageFrameStartedLoading>>(socket, {
        method: 'Page.frameStartedLoading',
        params: { frameId: this.frameId },
      });
      // Delay this a bit
      setTimeout(() => {
        console.log('Page.frameStoppedLoading sent');
        send<DeviceRequest<PageFrameStoppedLoading>>(socket, {
          method: 'Page.frameStoppedLoading',
          params: { frameId: this.frameId },
        });
      }, 500);

      // Link this event to the frame
      if (!message.params.executionContextAuxData) {
        message.params.executionContextAuxData = this.frameAuxData;
      }
      setTimeout(() => {
        console.log('Debugger.scriptParsed sent');
        send<DeviceRequest<DebuggerScriptParsed>>(socket, message);
      }, 1000);

      // Block this message, to force correct order
      return true;
    }

    // Once a `Runtime.executionContextCreated` event is received, link it to the frame
    if (message.method === 'Runtime.executionContextCreated' && !message.params.context.auxData) {
      console.log('Runtime.executionContextCreated mutated');
      message.params.context.auxData = this.frameAuxData;
    }

    return false;
  }
}

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/Page#event-frameStartedLoading */
export type PageFrameStartedLoading = CdpMessage<
  'Page.frameStartedLoading',
  Protocol.Page.FrameStartedLoadingEvent,
  Protocol.Page.FrameStartedLoadingEvent
>;

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/Page#event-frameStoppedLoading */
export type PageFrameStoppedLoading = CdpMessage<
  'Page.frameStoppedLoading',
  Protocol.Page.FrameStoppedLoadingEvent,
  Protocol.Page.FrameStoppedLoadingEvent
>;

/** @see https://cdpstatus.reactnative.dev/devtools-protocol/tot/Debugger#event-scriptParsed */
export type DebuggerScriptParsed = CdpMessage<
  'Debugger.scriptParsed',
  Protocol.Debugger.ScriptParsedEvent,
  never
>;

export type RuntimeExecutionContextCreated = CdpMessage<
  'Runtime.executionContextCreated',
  Protocol.Runtime.ExecutionContextCreatedEvent
>;
