#pragma once

#ifdef __ANDROID__

#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>

#endif
#ifdef __APPLE__
#include <OpenGLES/EAGL.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#endif

#include <jsi/jsi.h>

#include <functional>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>
