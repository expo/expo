#pragma once

#include <react/renderer/components/MoviesPeekAndPop/EventEmitters.h>
#include <react/renderer/components/MoviesPeekAndPop/Props.h>
#include <react/renderer/components/MoviesPeekAndPop/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <jsi/jsi.h>
#include "PeekAndPopPreviewState.h"

namespace facebook::react
{
    JSI_EXPORT extern const char PeekAndPopPreviewComponentName[];

    /*
     * `ShadowNode` for <PeekAndPopPreview> component.
     */
    using PeekAndPopPreviewShadowNode = ConcreteViewShadowNode<
        PeekAndPopPreviewComponentName,
        PeekAndPopPreviewProps,
        PeekAndPopPreviewEventEmitter,
        PeekAndPopPreviewState>;
}
