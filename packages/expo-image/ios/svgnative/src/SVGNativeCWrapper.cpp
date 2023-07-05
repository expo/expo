/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#include "SVGNativeCWrapper.h"
#include "SVGDocument.h"
#include "SVGRenderer.h"
#ifdef USE_CAIRO
#include "ports/cairo/CairoSVGRenderer.h"
#endif
#ifdef USE_CG
#include "ports/cg/CGSVGRenderer.h"
#include <CoreServices/CoreServices.h>
#include <CoreGraphics/CoreGraphics.h>
#endif
#ifdef USE_SKIA
#include "ports/skia/SkiaSVGRenderer.h"
#include "SkCanvas.h"
#include "SkImage.h"
#endif
#ifdef USE_GDIPLUS
#include <windows.h>
#include <Gdiplus.h>
#include "ports/gdiplus/GDIPlusSVGRenderer.h"
#endif
#ifdef USE_TEXT
#include "ports/string/StringSVGRenderer.h"
#endif

#include <map>
#include <memory>

template <typename T>
void ignore(T &&)
{ }

struct svg_native_color_map_t_
{
    SVGNative::ColorMap mColorMap;
};

struct svg_native_t_
{
    std::shared_ptr<SVGNative::SVGRenderer> mRenderer;
    std::unique_ptr<SVGNative::SVGDocument> mDocument;
    svg_native_renderer_type_t mRendererType{SVG_RENDERER_UNKNOWN};
    svg_native_color_map_t* mColorMap{};
};

svg_native_color_map_t* svg_native_color_map_create()
{
    return reinterpret_cast<svg_native_color_map_t*>(new svg_native_color_map_t_);
}

void svg_native_color_map_add(svg_native_color_map_t* color_map, const char* color_key, float red, float green, float blue, float alpha)
{
    if (auto _color_map = dynamic_cast<svg_native_color_map_t_*>(color_map))
    {
        _color_map->mColorMap.insert({color_key, {red, green, blue, alpha}});
    }
}

void svg_native_color_map_destroy(svg_native_color_map_t* color_map)
{
    if (auto _color_map = dynamic_cast<svg_native_color_map_t_*>(color_map))
    {
        delete _color_map;
    }
}

svg_native_t* svg_native_create(svg_native_renderer_type_t renderer_type, const char* document_string)
{
    auto sn = new svg_native_t_;

    switch (renderer_type)
    {
    case SVG_RENDERER_CAIRO:
    {
#ifdef USE_CAIRO
        sn->mRenderer = std::make_shared<SVGNative::CairoSVGRenderer>();
        sn->mRendererType = renderer_type;
#endif
        break;
    }
    case SVG_RENDERER_CG:
    {
#ifdef USE_CG
        sn->mRenderer = std::make_shared<SVGNative::CGSVGRenderer>();
        sn->mRendererType = renderer_type;
#endif
        break;
    }
    case SVG_RENDERER_GDIPLUS:
    {
#ifdef USE_GDIPLUS
        sn->mRenderer = std::make_shared<SVGNative::GDIPlusSVGRenderer>();
        sn->mRendererType = renderer_type;
#endif
        break;
    }
    case SVG_RENDERER_SKIA:
    {
#ifdef USE_SKIA
        sn->mRenderer = std::make_shared<SVGNative::SkiaSVGRenderer>();
        sn->mRendererType = renderer_type;
#endif
        break;
    }
    case SVG_RENDERER_STRING:
    {
#ifdef USE_TEXT
        sn->mRenderer = std::make_shared<SVGNative::StringSVGRenderer>();
        sn->mRendererType = renderer_type;
#endif
        break;
    }
    default:
        break;
    }

    if (!sn->mRenderer)
        return nullptr;

    sn->mDocument = SVGNative::SVGDocument::CreateSVGDocument(document_string, sn->mRenderer);

    return reinterpret_cast<svg_native_t*>(sn);
}

void svg_native_set_color_map(svg_native_t* sn, svg_native_color_map_t* color_map)
{
    if (auto _sn = dynamic_cast<svg_native_t_*>(sn))
    {
        _sn->mColorMap = color_map;
    }
}

void svg_native_set_renderer(svg_native_t* sn, svg_native_renderer_t* renderer)
{
    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn)
        return;

    switch (_sn->mRendererType)
    {
    case SVG_RENDERER_CAIRO:
    {
#ifdef USE_CAIRO
        if (auto nativeRenderer = static_cast<cairo_t*>(renderer))
        {
            if (auto snRenderer = std::dynamic_pointer_cast<SVGNative::CairoSVGRenderer>(_sn->mRenderer))
                snRenderer->SetCairo(nativeRenderer);
            return;
        }
#endif
        break;
    }
    case SVG_RENDERER_CG:
    {
#ifdef USE_CG
        if (auto nativeRenderer = static_cast<CGContextRef>(renderer))
        {
            if (auto snRenderer = std::dynamic_pointer_cast<SVGNative::CGSVGRenderer>(_sn->mRenderer))
                snRenderer->SetGraphicsContext(nativeRenderer);
            return;
        }
#endif
        break;
    }
    case SVG_RENDERER_GDIPLUS:
    {
#ifdef USE_GDIPLUS
        if (auto nativeRenderer = static_cast<Gdiplus::Graphics*>(renderer))
        {
            if (auto snRenderer = std::dynamic_pointer_cast<SVGNative::GDIPlusSVGRenderer>(_sn->mRenderer))
                snRenderer->SetGraphicsContext(nativeRenderer);
            return;
        }
#endif
        break;
    }
    case SVG_RENDERER_SKIA:
    {
#ifdef USE_SKIA
        if (auto nativeRenderer = static_cast<SkCanvas*>(renderer))
        {
            if (auto snRenderer = std::dynamic_pointer_cast<SVGNative::SkiaSVGRenderer>(_sn->mRenderer))
                snRenderer->SetSkCanvas(nativeRenderer);
            return;
        }
#endif
        break;
    }
    default:
        ignore(renderer);
        break;
    }
}

float svg_native_canvas_width(svg_native_t* sn)
{
    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn || !_sn->mDocument)
        return 0;
    return _sn->mDocument->Width();
}

float svg_native_canvas_height(svg_native_t* sn)
{
    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn || !_sn->mDocument)
        return 0;
    return _sn->mDocument->Height();
}

void svg_native_render(svg_native_t* sn)
{
    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn || !_sn->mDocument)
        return;
    
    if (_sn->mColorMap)
        _sn->mDocument->Render(_sn->mColorMap->mColorMap);
    else
        _sn->mDocument->Render();
}

void svg_native_render_size(svg_native_t* sn, float width, float height)
{
    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn || !_sn->mDocument)
        return;
    
    if (_sn->mColorMap)
        _sn->mDocument->Render(_sn->mColorMap->mColorMap, width, height);
    else
        _sn->mDocument->Render(width, height);
}

#ifdef USE_TEXT
void svg_native_get_output(svg_native_t* sn, char** buff, size_t* length)
{
    if (!buff || !length)
        return;

    *buff = NULL;
    *length = 0;

    auto _sn = dynamic_cast<svg_native_t_*>(sn);
    if (!_sn || _sn->mRendererType != SVG_RENDERER_STRING)
        return;

    auto renderer = std::dynamic_pointer_cast<SVGNative::StringSVGRenderer>(_sn->mRenderer);
    if (!renderer)
        return;

    const auto& string = renderer->String();

    auto size = string.length() + 1;
    *buff = (char*)malloc(size * sizeof(char));
    if (!(*buff))
        return;

    memcpy(*buff, string.c_str(), size);
    *length = string.length();

    return;
}
#endif

void svg_native_destroy(svg_native_t* sn)
{
    if (auto _sn = dynamic_cast<svg_native_t_*>(sn))
        delete _sn;
}
