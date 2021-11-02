// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default class MapperRegistry {
  sortedMappers = [];
  mappers = new Map();

  updatedSinceLastExecute = false;

  constructor(module) {
    this._module = module;
  }

  startMapper(mapper) {
    this.mappers.set(mapper.id, mapper);
    this.updatedSinceLastExecute = true;
    return mapper.id;
  }

  stopMapper(id) {
    this.mappers.delete(id);
    this.updatedSinceLastExecute = true;
  }

  execute() {
    if (this.updatedSinceLastExecute) {
      this.updateOrder();
      this.updatedSinceLastExecute = false;
    }

    for (let i = 0, len = this.sortedMappers.length; i < len; ++i) {
      const mapper = this.sortedMappers[i];
      if (mapper.dirty) {
        mapper.execute();
      }
    }
  }

  updateOrder() {
    const nodes = [...this.mappers.values()].map((mapper) => new Node(mapper));

    const mappersById = {};
    this.mappers.forEach((mapper) => {
      mappersById[mapper.id] = mapper;
    });

    // create a graph from array of nodes
    for (let i = 0, nodesLen = nodes.length; i < nodesLen; ++i) {
      const node = nodes[i];
      if (node.mapper.outputs.length === 0) {
        continue;
      }
      for (let j = 0; j < nodesLen; ++j) {
        const restNode = nodes[j];
        if (i === j || restNode.mapper.inputs.length === 0) {
          continue;
        }
        for (
          let outi = 0, outputsLen = node.mapper.outputs.length;
          outi < outputsLen;
          ++outi
        ) {
          for (
            let resti = 0, restLen = restNode.mapper.inputs.length;
            resti < restLen;
            ++resti
          ) {
            if (
              node.mapper.outputs[outi]._id ===
              restNode.mapper.inputs[resti]._id
            ) {
              node.children.push(restNode);
            }
          }
        }
      }
    }

    const post = {};
    let postCounter = 1;
    const dfs = (node) => {
      const index = nodes.indexOf(node);
      if (index === -1) {
        // this node has already been handled
        return;
      }
      ++postCounter;
      nodes.splice(index, 1);
      if (node.children.length === 0 && nodes.length > 0) {
        post[node.mapper.id] = postCounter++;
        dfs(nodes[0]);
        return;
      }
      for (let i = 0, len = node.children.length; i < len; ++i) {
        dfs(node.children[i]);
      }
      post[node.mapper.id] = postCounter++;
    };

    while (nodes.length) dfs(nodes[0]);

    const postArray = Object.keys(post).map((key) => {
      return [key, post[key]];
    });
    postArray.sort((a, b) => {
      return b[1] - a[1];
    });

    // clear sorted mappers
    this.sortedMappers = [];

    for (let i = 0, len = postArray.length; i < len; ++i) {
      const [id] = postArray[i];
      this.sortedMappers.push(mappersById[id]);
    }
  }

  get needRunOnRender() {
    return this.updatedSinceLastExecute;
  }
}

class Node {
  mapper = null;
  children = [];

  constructor(mapper, _parents = [], children = []) {
    this.mapper = mapper;
    this.children = children;
  }
}
