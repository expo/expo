import ReanimatedModule from '../ReanimatedModule';
import { Platform } from 'react-native';

const UPDATED_NODES = [];

let loopID = 1;
let propUpdatesEnqueued = null;
let nodeCount = 0;
let callID = "";

export function getCallID() {
  return callID;
}

export function setCallID(nextCallID) {
  callID = nextCallID;
}

function sanitizeConfig(config) {
  if (Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos' || ['undefined', 'string', 'function', 'boolean', 'number'].includes(typeof config)) {
    return config;
  } else if (Array.isArray(config)) {
    return config.map(sanitizeConfig);
  } else if (config instanceof AnimatedNode) {
    return config.__nodeID;
  } else if (typeof config === 'object') {
    const output = {};
    for (const property in config) {
      if (property in config) {
        output[property] = sanitizeConfig(config[property]);
      }
    }
    return output;
  }
  // unhandled
  return config;
}

function runPropUpdates() {
  const visitedNodes = new Set();
  const findAndUpdateNodes = node => {
    if (!node) {
      console.warn('findAndUpdateNodes was passed a nullish node');
      return;
    }

    if (visitedNodes.has(node)) {
      return;
    } else {
      visitedNodes.add(node);
    }
    if (typeof node.update === 'function') {
      node.update();
    } else {
      const nodes = node.__getChildren();
      if (nodes) {
        for (let i = 0, l = nodes.length; i < l; i++) {
          findAndUpdateNodes(nodes[i]);
        }
      }
    }
  };
  for (let i = 0; i < UPDATED_NODES.length; i++) {
    const node = UPDATED_NODES[i];
    findAndUpdateNodes(node);
  }
  UPDATED_NODES.length = 0; // clear array
  propUpdatesEnqueued = null;
  loopID += 1;
}

export default class AnimatedNode {

  __nodeID;
  __lastLoopID = { "": -1 };
  __memoizedValue = { "": null };
  __children = [];

  constructor(nodeConfig, inputNodes) {
    this.__nodeID = ++nodeCount;
    this.__nodeConfig = sanitizeConfig(nodeConfig);
    this.__initialized = false;
    this.__inputNodes =
      inputNodes && inputNodes.filter(node => node instanceof AnimatedNode);
  }

  toString() {
    return `AnimatedNode, id: ${this.__nodeID}`;
  }

  __attach() {
    this.__nativeInitialize();

    const nodes = this.__inputNodes;

    if (nodes) {
      for (let i = 0, l = nodes.length; i < l; i++) {
        nodes[i].__addChild(this);
      }
    }
  }

  __detach() {
    const nodes = this.__inputNodes;

    if (nodes) {
      for (let i = 0, l = nodes.length; i < l; i++) {
        nodes[i].__removeChild(this);
      }
    }

    this.__nativeTearDown();
  }

  __getValue() {
    if (!(callID in this.__lastLoopID) || this.__lastLoopID[callID] < loopID) {
      this.__lastLoopID[callID] = loopID;
      const result = this.__onEvaluate();
      this.__memoizedValue[callID] = result;
      return result;
    }
    return this.__memoizedValue[callID];
  }

  __forceUpdateCache(newValue) {
    this.__memoizedValue[callID] = newValue;
    this.__markUpdated();
  }

  __dangerouslyRescheduleEvaluate() {
    this.__lastLoopID[callID] = -1;
    this.__markUpdated();
  }

  __markUpdated() {
    UPDATED_NODES.push(this);
    if (!propUpdatesEnqueued) {
      propUpdatesEnqueued = setImmediate(runPropUpdates);
    }
  }

  __nativeInitialize() {
    if (!this.__initialized) {
      ReanimatedModule.createNode(this.__nodeID, { ...this.__nodeConfig });
      this.__initialized = true;
    }
  }

  __nativeTearDown() {
    if (this.__initialized) {
      ReanimatedModule.dropNode(this.__nodeID);
      this.__initialized = false;
    }
  }

  isNativelyInitialized() {
    return this.__initialized;
  }

  __onEvaluate() {
    throw new Error('Missing implementation of onEvaluate');
  }

  __getProps() {
    return this.__getValue();
  }

  __getChildren() {
    return this.__children;
  }

  __addChild(child) {
    if (this.__children.length === 0) {
      this.__attach();
    }
    this.__children.push(child);
    child.__nativeInitialize();

    if (ReanimatedModule.connectNodes) {
      ReanimatedModule.connectNodes(this.__nodeID, child.__nodeID);
    } else {
      child.__dangerouslyRescheduleEvaluate();
    }
  }

  __removeChild(child) {
    const index = this.__children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }

    if (ReanimatedModule.disconnectNodes) {
      ReanimatedModule.disconnectNodes(this.__nodeID, child.__nodeID);
    }

    this.__children.splice(index, 1);
    if (this.__children.length === 0) {
      this.__detach();
    }
  }

  _connectAnimatedView(nativeViewTag) {
    if (ReanimatedModule.connectNodeToView) {
      ReanimatedModule.connectNodeToView(this.__nodeID, nativeViewTag);
    } else {
      this.__dangerouslyRescheduleEvaluate();
    }
  }

  _disconnectAnimatedView(nativeViewTag) {
    ReanimatedModule.disconnectNodeFromView(this.__nodeID, nativeViewTag);
  }
}
