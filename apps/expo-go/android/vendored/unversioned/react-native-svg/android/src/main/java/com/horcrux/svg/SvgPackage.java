/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import static com.horcrux.svg.RenderableViewManager.*;

import androidx.annotation.Nullable;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.ViewManagerOnDemandReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Nonnull;
import javax.inject.Provider;

@ReactModuleList(
    nativeModules = {
      SvgViewModule.class,
      RNSVGRenderableManager.class,
    })
public class SvgPackage extends TurboReactPackage implements ViewManagerOnDemandReactPackage {

  private @Nullable Map<String, ModuleSpec> mViewManagers;

  private Map<String, ModuleSpec> getViewManagersMap(final ReactApplicationContext reactContext) {
    if (mViewManagers == null) {
      Map<String, ModuleSpec> specs = MapBuilder.newHashMap();
      specs.put(
          GroupViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new GroupViewManager();
                }
              }));
      specs.put(
          PathViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new PathViewManager();
                }
              }));
      specs.put(
          CircleViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new CircleViewManager();
                }
              }));
      specs.put(
          EllipseViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new EllipseViewManager();
                }
              }));
      specs.put(
          LineViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new LineViewManager();
                }
              }));
      specs.put(
          RectViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new RectViewManager();
                }
              }));
      specs.put(
          TextViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new TextViewManager();
                }
              }));
      specs.put(
          TSpanViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new TSpanViewManager();
                }
              }));
      specs.put(
          TextPathViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new TextPathViewManager();
                }
              }));
      specs.put(
          ImageViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new ImageViewManager();
                }
              }));
      specs.put(
          ClipPathViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new ClipPathViewManager();
                }
              }));
      specs.put(
          DefsViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new DefsViewManager();
                }
              }));
      specs.put(
          UseViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new UseViewManager();
                }
              }));
      specs.put(
          SymbolManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new SymbolManager();
                }
              }));
      specs.put(
          LinearGradientManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new LinearGradientManager();
                }
              }));
      specs.put(
          RadialGradientManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new RadialGradientManager();
                }
              }));
      specs.put(
          PatternManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new PatternManager();
                }
              }));
      specs.put(
          MaskManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new MaskManager();
                }
              }));
      specs.put(
          ForeignObjectManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new ForeignObjectManager();
                }
              }));
      specs.put(
          MarkerManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new MarkerManager();
                }
              }));
      specs.put(
          SvgViewManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(
              new Provider<NativeModule>() {
                @Override
                public NativeModule get() {
                  return new SvgViewManager();
                }
              }));
      mViewManagers = specs;
    }
    return mViewManagers;
  }

  /** {@inheritDoc} */
  @Override
  public List<String> getViewManagerNames(ReactApplicationContext reactContext) {
    return (List<String>) getViewManagersMap(reactContext).keySet();
  }

  @Override
  protected List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>(getViewManagersMap(reactContext).values());
  }

  /** {@inheritDoc} */
  @Override
  public @Nullable ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName) {
    ModuleSpec spec = getViewManagersMap(reactContext).get(viewManagerName);
    return spec != null ? (ViewManager) spec.getProvider().get() : null;
  }

  @Override
  public NativeModule getModule(String name, @Nonnull ReactApplicationContext reactContext) {
    switch (name) {
      case SvgViewModule.NAME:
        return new SvgViewModule(reactContext);
      case RNSVGRenderableManager.NAME:
        return new RNSVGRenderableManager(reactContext);
      default:
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    try {
      Class<?> reactModuleInfoProviderClass =
          Class.forName("com.horcrux.svg.SvgPackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      // ReactModuleSpecProcessor does not run at build-time. Create this ReactModuleInfoProvider by
      // hand.
      return new ReactModuleInfoProvider() {
        @Override
        public Map<String, ReactModuleInfo> getReactModuleInfos() {
          final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();

          Class<? extends NativeModule>[] moduleList =
              new Class[] {
                SvgViewModule.class, RNSVGRenderableManager.class,
              };

          for (Class<? extends NativeModule> moduleClass : moduleList) {
            ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

            reactModuleInfoMap.put(
                reactModule.name(),
                new ReactModuleInfo(
                    reactModule.name(),
                    moduleClass.getName(),
                    reactModule.canOverrideExistingModule(),
                    reactModule.needsEagerInit(),
                    reactModule.hasConstants(),
                    reactModule.isCxxModule(),
                    TurboModule.class.isAssignableFrom(moduleClass)));
          }

          return reactModuleInfoMap;
        }
      };
    } catch (InstantiationException | IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for MyPackage$$ReactModuleInfoProvider", e);
    }
  }

  @SuppressWarnings("unused")
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }
}
