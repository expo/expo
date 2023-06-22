#pragma once

#include "JsiHostObject.h"
#include "NodeProp.h"
#include "NodePropsContainer.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "RNSkPlatformContext.h"

namespace RNSkia {

template <class TNode> class JsiDomNodeCtor {
public:
  /**
   Constructor to add to the Api object
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto node = std::make_shared<TNode>(context);
      node->initializeNode(runtime, thisValue, arguments, count);
      return jsi::Object::createFromHostObject(runtime, std::move(node));
    };
  }
};

static std::atomic<size_t> NodeIdent = 1000;

typedef enum {
  RenderNode = 1,
  DeclarationNode = 2,
} NodeClass;

/**
 Implements an abstract base class for nodes in the Skia Reconciler. This node
 coresponds to the native implementation of the Node.ts class in Javascript.
 */
class JsiDomNode : public JsiHostObject,
                   public std::enable_shared_from_this<JsiDomNode> {
public:
  /**
   Contructor. Takes as parameters the values comming from the JS world that
   initialized the class.
   */
  JsiDomNode(std::shared_ptr<RNSkPlatformContext> context, const char *type,
             NodeClass nodeClass)
      : _type(type), _context(context), _nodeClass(nodeClass),
        _nodeId(NodeIdent++), JsiHostObject() {
#if SKIA_DOM_DEBUG
    printDebugInfo("JsiDomNode." + std::string(_type) +
                   " CTOR - nodeId: " + std::to_string(_nodeId));
#endif
  }

  virtual ~JsiDomNode() {
#if SKIA_DOM_DEBUG
    printDebugInfo("JsiDomNode." + std::string(_type) +
                   " DTOR - nodeId: " + std::to_string(_nodeId));
#endif
  }

  /**
   Called when creating the node, resolves properties from the node constructor.
   These properties are materialized, ie. no animated values or anything.
   */
  JSI_HOST_FUNCTION(initializeNode) {
    return setProps(runtime, thisValue, arguments, count);
  }

  /**
   JS-function for setting the properties from the JS reconciler on the node.
   */
  JSI_HOST_FUNCTION(setProps) {
    if (count == 1) {
      // Initialize properties container
      setProps(runtime, arguments[0]);
    } else {
      setEmptyProps();
    }
    return jsi::Value::undefined();
  }

  /**
   Updates the selected property value
   */
  JSI_HOST_FUNCTION(setProp) {
    if (_propsContainer == nullptr) {
      // TODO: we ignore individual properties updates if the initial properties
      // hasn't been defined. It is likely an error if we reach this branch and
      // perhaps should throw an exception but platformContext isn't available
      // here.
      return jsi::Value::undefined();
    }
    auto propName = arguments[0].asString(runtime).utf8(runtime);
    const jsi::Value &propValue = arguments[1];

    // Enumerate all props with this name and update. The
    // enumerateMappedPropsByName function is thread safe and locks props so it
    // can be called from all threads.
    _propsContainer->enumerateMappedPropsByName(propName, [&](NodeProp *prop) {
      prop->updateValue(runtime, propValue);
    });

    return jsi::Value::undefined();
  }

  /**
   JS Function to be called when the node is no longer part of the reconciler
   tree. Use for cleaning up.
   */
  JSI_HOST_FUNCTION(dispose) {
    dispose(false);
    return jsi::Value::undefined();
  }

  /**
   JS Function for adding a child node to this node.
   */
  JSI_HOST_FUNCTION(addChild) {
    // child: Node<unknown>
    auto newChild =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 0);
    addChild(newChild);
    return jsi::Value::undefined();
  }

  /*
   JS Function for removing a child node from this node
   */
  JSI_HOST_FUNCTION(removeChild) {
    auto child =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 0);
    removeChild(child);
    return jsi::Value::undefined();
  }

  /**
   JS Function for insering a child node to a specific location in the children
   array on this node
   */
  JSI_HOST_FUNCTION(insertChildBefore) {
    // child: Node<unknown>, before: Node<unknown>
    auto child =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 0);
    auto before =
        getArgumentAsHostObject<JsiDomNode>(runtime, arguments, count, 1);
    insertChildBefore(child, before);
    return jsi::Value::undefined();
  }

  /**
   JS Function for getting child nodes for this node
   */
  JSI_HOST_FUNCTION(children) {
    auto array = jsi::Array(runtime, _children.size());

    size_t index = 0;
    for (auto child : _children) {
      array.setValueAtIndex(runtime, index++, child->asHostObject(runtime));
    }
    return array;
  }

  /**
   JS Property for getting the type of node
   */
  JSI_PROPERTY_GET(type) {
    return jsi::String::createFromUtf8(runtime, getType());
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiDomNode, type))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiDomNode, setProps),
                       JSI_EXPORT_FUNC(JsiDomNode, setProp),
                       JSI_EXPORT_FUNC(JsiDomNode, addChild),
                       JSI_EXPORT_FUNC(JsiDomNode, removeChild),
                       JSI_EXPORT_FUNC(JsiDomNode, insertChildBefore),
                       JSI_EXPORT_FUNC(JsiDomNode, children),
                       JSI_EXPORT_FUNC(JsiDomNode, dispose))

  /**
   Returns the node type.
  */
  const char *getType() { return _type; }

  /**
   Returns the identifier for the node
   */
  size_t getNodeId() { return _nodeId; }

  /**
   Returns the container for node properties
   */
  NodePropsContainer *getPropsContainer() { return _propsContainer.get(); }

  /**
   Callback that will be called when the node is disposed - typically registered
   from the dependency manager so that nodes can be removed and unsubscribed
   from when removed from the reconciler tree.
   */
  void setDisposeCallback(std::function<void()> disposeCallback) {
    _disposeCallback = disposeCallback;
  }

  /**
   Invalidates and marks then context as changed. The default behaviour is an
   empty implementation
   */
  virtual void invalidateContext() = 0;

  /*
   Returns the class of node so that we can do loops faster without
   having to check using runtime type information
   */
  NodeClass getNodeClass() { return _nodeClass; }

  /**
   Updates any pending property changes in all nodes and child nodes. This
   function will swap any pending property changes in this and children with any
   waiting values that has been set by the javascript thread. Props will also be
   marked as changed so that we can calculate wether updates are required or
   not.
   */
  void commitPendingChanges() {
    // Update properties container
    if (_propsContainer != nullptr) {
      _propsContainer->updatePendingValues();
    }

    // Run all pending node operations
    {
      std::lock_guard<std::mutex> lock(_childrenLock);
      for (auto &op : _queuedNodeOps) {
        op();
      }

      _queuedNodeOps.clear();
    }

    // Update children
    for (auto &child : _children) {
      child->commitPendingChanges();
    }
  }

  /**
   When pending properties has been updated and all rendering is done, we call
   this function to mark any changes as processed. This call also resolves all
   child nodes
   */
  virtual void resetPendingChanges() {
    // Mark self as resolved
    if (_propsContainer != nullptr) {
      _propsContainer->markAsResolved();
    }

    // Now let's invalidate if needed
    if (_isDisposing && !_isDisposed) {
      invalidate();
    }

    // Resolve children
    for (auto &child : _children) {
      child->resetPendingChanges();
    }
  }

  /**
  Empty implementation of the decorate context method
  */
  virtual void decorateContext(DeclarationContext *context) {
    // Empty implementation
  }

  /**
   Called when a node has been removed from the dom tree and needs to be cleaned
   up. If the invalidate parameter is set, we will invalidate the node directly.
   Calling dispose from the JS dispose function calls this with invalidate set
   to false, while the dom render view calls this with true.
   */
  virtual void dispose(bool immediate) {
    if (_isDisposing) {
      return;
    }
    _isDisposing = true;
    if (immediate) {
      invalidate();
    }
  }

protected:
  /**
   Adds an operation that will be executed when the render cycle is finished.
   */
  void enqueAsynOperation(std::function<void()> &&fp) {
    std::lock_guard<std::mutex> lock(_childrenLock);
    _queuedNodeOps.push_back(std::move(fp));
  }
  /**
   Override to define properties in node implementations
   */
  virtual void defineProperties(NodePropsContainer *container) {}

  /**
   Returns the platform context
   */
  std::shared_ptr<RNSkPlatformContext> getContext() { return _context; }

  /**
   Returns this node as a host object that can be returned to the JS side.
  */
  jsi::Object asHostObject(jsi::Runtime &runtime) {
    return jsi::Object::createFromHostObject(runtime, shared_from_this());
  }

  /**
   Native implementation of the set properties method. This is called from the
   reconciler when properties are set due to changes in React.
   */
  void setProps(jsi::Runtime &runtime, const jsi::Value &maybeProps) {
#if SKIA_DOM_DEBUG
    printDebugInfo("JS:setProps(nodeId: " + std::to_string(_nodeId) + ")");
#endif
    // Initialize properties container
    ensurePropertyContainer();

    // Update properties container
    _propsContainer->setProps(runtime, maybeProps);

    // Invalidate context
    invalidateContext();
  }

  /**
   Called for components that has no properties
   */
  void setEmptyProps() {
#if SKIA_DOM_DEBUG
    printDebugInfo("JS:setEmptyProps(nodeId: " + std::to_string(_nodeId) + ")");
#endif
    // Initialize properties container
    ensurePropertyContainer();
  }

  /**
   Returns all child JsiDomNodes for this node.
   */
  const std::vector<std::shared_ptr<JsiDomNode>> &getChildren() {
    std::lock_guard<std::mutex> lock(_childrenLock);
    return _children;
  }

  /**
   Override to be notified when a node property has changed
   */
  virtual void onPropertyChanged(BaseNodeProp *prop) {}

  /**
   Adds a child node to the array of children for this node
   */
  virtual void addChild(std::shared_ptr<JsiDomNode> child) {
#if SKIA_DOM_DEBUG
    printDebugInfo("JS:addChild(childId: " + std::to_string(child->_nodeId) +
                   ")");
#endif
    enqueAsynOperation([child, weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        self->_children.push_back(child);
        child->setParent(self.get());
      }
    });
  }

  /**
   Inserts a child node before a given child node in the children array for this
   node
   */
  virtual void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                                 std::shared_ptr<JsiDomNode> before) {
#if SKIA_DOM_DEBUG
    printDebugInfo(
        "JS:insertChildBefore(childId: " + std::to_string(child->_nodeId) +
        ", beforeId: " + std::to_string(before->_nodeId) + ")");
#endif
    enqueAsynOperation([child, before, weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        auto position =
            std::find(self->_children.begin(), self->_children.end(), before);
        self->_children.insert(position, child);
        child->setParent(self.get());
      }
    });
  }

  /**
   Removes a child. Removing a child will remove the child from the array of
   children and call dispose on the child node.
   */
  virtual void removeChild(std::shared_ptr<JsiDomNode> child) {
#if SKIA_DOM_DEBUG
    printDebugInfo("JS:removeChild(childId: " + std::to_string(child->_nodeId) +
                   ")");
#endif
    auto removeChild = [child,
                        weakSelf = weak_from_this()](bool immediate = false) {
      auto self = weakSelf.lock();
      if (self) {
        // Delete child itself
        self->_children.erase(
            std::remove_if(self->_children.begin(), self->_children.end(),
                           [child](const auto &node) { return node == child; }),
            self->_children.end());

        child->dispose(immediate);
      }
    };

    if (_isDisposing) {
      removeChild(false);
    } else {
      enqueAsynOperation(removeChild);
    }
  }

#if SKIA_DOM_DEBUG
  std::string getLevelIndentation(size_t indentation = 0) {
    JsiDomNode *curParent = _parent;
    while (curParent != nullptr) {
      indentation++;
      curParent = curParent->getParent();
    }
    return std::string(indentation * 2, ' ');
  }

  void printDebugInfo(const std::string &message, size_t indentation = 0) {
    RNSkLogger::logToConsole("%s%s %lu: %s",
                             getLevelIndentation(indentation).c_str(),
                             getType(), getNodeId(), message.c_str());
  }
#endif

  /**
   Sets the parent node
  */
  void setParent(JsiDomNode *parent) { _parent = parent; }

  /**
   Returns the parent node if set.
  */
  JsiDomNode *getParent() { return _parent; }

  /**
  Loops through all declaration nodes and gives each one of them the
  opportunity to decorate the context.
  */
  void decorateChildren(DeclarationContext *context) {
    for (auto &child : getChildren()) {
      // All JsiDomNodes has the decorateContext method - but only the
      // JsiDomDeclarationNode is actually doing stuff inside this method.
      child->decorateContext(context);
    }
  }

private:
  /**
   Invalidates the node - meaning removing and clearing children and properties
   **/
  void invalidate() {
    if (_isDisposing && !_isDisposed) {
#if SKIA_DOM_DEBUG
      printDebugInfo("JsiDomNode::invalidate: nodeid: " +
                     std::to_string(_nodeId));
#endif

      _isDisposed = true;

      // Clear parent
      this->setParent(nullptr);

      // Clear any async operations
      _queuedNodeOps.clear();

      // Callback signaling that we're done
      if (_disposeCallback != nullptr) {
        _disposeCallback();
        _disposeCallback = nullptr;
      }

      // Clear props
      if (_propsContainer != nullptr) {
        _propsContainer->dispose();
      }

      // Remove children
      std::vector<std::shared_ptr<JsiDomNode>> tmp;
      {
        std::lock_guard<std::mutex> lock(_childrenLock);
        tmp.reserve(_children.size());
        for (auto &child : _children) {
          tmp.push_back(child);
        }
        _children.clear();
      }
      for (auto &child : tmp) {
        child->dispose(true);
      }
    }
  }

  /**
   Creates and sets up the property container
   */
  void ensurePropertyContainer() {
    if (_propsContainer == nullptr) {
      _propsContainer = std::make_shared<NodePropsContainer>(
          getType(), [weakSelf = weak_from_this()](BaseNodeProp *p) {
            auto self = weakSelf.lock();
            if (self) {
              self->onPropertyChanged(p);
            }
          });

      // Ask sub classes to define their properties
      defineProperties(_propsContainer.get());
    }
  }

  const char *_type;
  std::shared_ptr<RNSkPlatformContext> _context;

  std::shared_ptr<NodePropsContainer> _propsContainer;

  std::function<void()> _disposeCallback;

  std::vector<std::shared_ptr<JsiDomNode>> _children;
  std::mutex _childrenLock;

  std::atomic<bool> _isDisposing = {false};
  bool _isDisposed = false;

  size_t _nodeId;

  std::vector<std::function<void()>> _queuedNodeOps;

  JsiDomNode *_parent = nullptr;

  NodeClass _nodeClass;
};

} // namespace RNSkia
