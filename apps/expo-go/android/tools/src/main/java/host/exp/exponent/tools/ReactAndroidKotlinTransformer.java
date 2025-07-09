package host.exp.exponent.tools;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ReactAndroidKotlinTransformer {
    public interface KotlinTransformer {
        String transform(String content);
    }

    private static final Map<String, KotlinTransformer> KOTLIN_TRANSFORMERS = new HashMap<>();

    static {
        KOTLIN_TRANSFORMERS.put("modules/network/OkHttpClientProvider.kt", new OkHttpClientTransformer());
        KOTLIN_TRANSFORMERS.put("modules/core/ExceptionsManagerModule.kt", new ExceptionsManagerTransformer());
        KOTLIN_TRANSFORMERS.put("bridge/DefaultJSExceptionHandler.kt", new JSExceptionHandlerTransformer());
        KOTLIN_TRANSFORMERS.put("devsupport/DevInternalSettings.kt", new DevInternalSettingsTransformer());
        KOTLIN_TRANSFORMERS.put("modules/debug/interfaces/DeveloperSettings.kt", new DeveloperSettingsTransformer());
        KOTLIN_TRANSFORMERS.put("BaseReactPackage.kt", new BaseReactPackageTransformer());
        KOTLIN_TRANSFORMERS.put("devsupport/DevSupportManagerBase.kt", new DevSupportManagerBaseTransformer());
        KOTLIN_TRANSFORMERS.put("modules/network/NetworkingModule.kt", new NetworkingModuleTransformer());
        KOTLIN_TRANSFORMERS.put("runtime/ReactSurfaceImpl.kt", new ReactSurfaceImplTransformer());
        KOTLIN_TRANSFORMERS.put("devsupport/BridgelessDevSupportManager.kt", new BridgelessDevSupportManagerTransformer());
        KOTLIN_TRANSFORMERS.put("devsupport/DevServerHelper.kt", new DevServerHelperTransformer());
    }

    public static String transformFile(String fileName, String content) {
        KotlinTransformer transformer = KOTLIN_TRANSFORMERS.get(fileName);
        if (transformer != null) {
            return transformer.transform(content);
        }
        return content;
    }

    public static void processAllKotlinFiles(String basePath) {
        for (String fileName : KOTLIN_TRANSFORMERS.keySet()) {
            try {
                File file = new File(basePath + fileName);
                FileInputStream in = new FileInputStream(file);
                String content = new String(in.readAllBytes());
                in.close();

                String transformedContent = transformFile(fileName, content);

                try (FileOutputStream out = new FileOutputStream(file)) {
                    out.write(transformedContent.getBytes());
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static abstract class BaseKotlinTransformer implements KotlinTransformer {
        protected String wrapFunctionInTryCatch(String content, String functionName, String catchHandler) {
            String pattern = String.format(
                    "((?:@[A-Za-z]+\\s+)*(?:override\\s+)?(?:public\\s+|private\\s+|internal\\s+)?fun\\s+%s\\s*\\([^)]*\\)\\s*[^{]*\\{)" +
                            "((?:[^{}]*(?:\\{(?:[^{}]*(?:\\{[^{}]*\\})*[^{}]*)*\\})*[^{}]*)*)" +
                            "(\\})",
                    Pattern.quote(functionName)
            );

            Pattern funcPattern = Pattern.compile(pattern, Pattern.DOTALL);
            Matcher matcher = funcPattern.matcher(content);

            if (matcher.find()) {
                String functionSignature = matcher.group(1);
                String functionBody = matcher.group(2).trim();
                String closingBrace = matcher.group(3);

                String wrappedFunction = functionSignature + "\n" +
                        "        try {\n" +
                        "            " + functionBody.replaceAll("(?m)^", "    ") + "\n" +
                        "        } catch (expoException: Exception) {\n" +
                        "            " + catchHandler.replaceAll("(?m)^", "    ") + "\n" +
                        "        }\n" +
                        "    " + closingBrace;

                return content.replace(matcher.group(0), wrappedFunction);
            }

            return content;
        }

        protected String replaceFunction(String content, String functionName, String newImplementation) {
            String pattern = String.format(
                    "((?:@[A-Za-z]+\\s+)*(?:override\\s+)?(?:public\\s+|private\\s+|internal\\s+)?fun\\s+%s\\s*\\([^)]*\\)\\s*[^{]*\\{)" +
                            "(?:[^{}]*(?:\\{(?:[^{}]*(?:\\{[^{}]*\\})*[^{}]*)*\\})*[^{}]*)*" +
                            "(\\})",
                    Pattern.quote(functionName)
            );

            Pattern funcPattern = Pattern.compile(pattern, Pattern.DOTALL);
            return funcPattern.matcher(content).replaceFirst(newImplementation);
        }

        protected String addBeforeEndOfClass(String content, String addition) {
            int lastBraceIndex = content.lastIndexOf("}");
            if (lastBraceIndex != -1) {
                return content.substring(0, lastBraceIndex) + "\n" + addition + "\n" + content.substring(lastBraceIndex);
            }
            return content;
        }

        protected String makePublic(String content, String declaration) {
            content = content.replaceAll("\\binternal\\s+" + Pattern.quote(declaration), "public " + declaration);
            content = content.replaceAll("\\bprivate\\s+" + Pattern.quote(declaration), "public " + declaration);
            content = content.replaceAll("(?<!public\\s)(?<!private\\s)(?<!internal\\s)\\b" + Pattern.quote(declaration), "public " + declaration);
            return content;
        }

        protected String getErrorHandling(String title, String details, String exceptionId, String isFatal) {
            return String.format(
                    """
                            try {
                                            Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod(
                                                "handleReactNativeError",
                                                String::class.java,
                                                Any::class.java,
                                                Int::class.java,
                                                Boolean::class.java
                                            ).invoke(null, %s, %s, %s, %s)
                                        } catch (expoHandleErrorException: Exception) {
                                            expoHandleErrorException.printStackTrace()
                                        }""",
                    title, details, exceptionId, isFatal
            );
        }
    }

    public static class OkHttpClientTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            String newImplementation = """
                    @JvmStatic
                    public fun createClient(): OkHttpClient {
                        try {
                            return (Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod(
                                "getOkHttpClient",
                                Class::class.java
                            ).invoke(null, OkHttpClientProvider::class.java) as OkHttpClient)
                        } catch (expoHandleErrorException: Exception) {
                            expoHandleErrorException.printStackTrace()
                            return factory?.createNewNetworkModuleClient() ?: createClientBuilder().build()
                        }
                    }""";

            return replaceFunction(content, "createClient", newImplementation);
        }
    }


    public static class ExceptionsManagerTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = wrapFunctionInTryCatch(content, "reportFatalException",
                    getErrorHandling("message", "stack", "(idDouble as Double).toInt()", "true"));
            return content;
        }
    }

    public static class JSExceptionHandlerTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            String newImplementation = """
                    public override fun handleException(e: Exception) {
                        try {
                            run {
                                if (e is RuntimeException) {
                                    throw e
                                } else {
                                    throw RuntimeException(e)
                                }
                            }
                        } catch (expoException: RuntimeException) {
                            try {
                                Class.forName("host.exp.exponent.ReactNativeStaticHelpers").getMethod(
                                    "handleReactNativeError",
                                    String::class.java,
                                    Any::class.java,
                                    Int::class.java,
                                    Boolean::class.java
                                ).invoke(null, expoException.message, null, -1, true)
                            } catch (expoHandleErrorException: Exception) {
                                expoHandleErrorException.printStackTrace()
                            }
                        }
                    }""";

            return replaceFunction(content, "handleException", newImplementation);
        }
    }

    public static class DevInternalSettingsTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = makePublic(content, "class DevInternalSettings");
            content = content.replace("companion object", "public companion object");
            content = content.replace("interface Listener", "public interface Listener");
            content = content.replace("fun onInternalSettingsChanged()", "public fun onInternalSettingsChanged()");
            content = content.replace("override fun addMenuItem(title: String) = Unit", "override fun addMenuItem(title: String): Unit = Unit");

            String addition = """
                    private var exponentActivityId: Int = -1
                    
                    public fun setExponentActivityId(value: Int) {
                        exponentActivityId = value
                    }
                    
                    public override fun getExponentActivityId(): Int {
                        return exponentActivityId
                    }""";

            return addBeforeEndOfClass(content, addition);
        }
    }

    public static class DeveloperSettingsTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            String addition = "public fun getExponentActivityId(): Int";
            return addBeforeEndOfClass(content, addition);
        }
    }

    public static class BaseReactPackageTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = makePublic(content, "fun getNativeModuleIterator");
            return content;
        }
    }

    public static class DevSupportManagerBaseTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            String newHasUpToDateImplementation = """
                override fun hasUpToDateJSBundleInCache(): Boolean {
                    return false
                }""";
            
            content = replaceFunction(content, "hasUpToDateJSBundleInCache", newHasUpToDateImplementation);

            return content;
        }

    }

    public static class NetworkingModuleTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = content.replace("private val client: OkHttpClient", "public val client: OkHttpClient");
            return content;
        }
    }

    public static class ReactSurfaceImplTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = content.replace("internal companion object {", "public companion object {");
            return content;
        }
    }

    public static class BridgelessDevSupportManagerTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            content = makePublic(content, "class BridgelessDevSupportManager");
            content = content.replaceAll("constructor", "public constructor");
            return content;
        }
    }

    public static class DevServerHelperTransformer extends BaseKotlinTransformer {
        @Override
        public String transform(String content) {
            String newCreateBundleURLImplementation = """
                    private fun createBundleURL(
                          mainModuleID: String,
                          type: BundleType,
                          host: String = packagerConnectionSettings.debugServerHost,
                          modulesOnly: Boolean = false,
                          runModule: Boolean = true
                      ): String {
                          try {
                              return Class.forName("host.exp.exponent.ReactNativeStaticHelpers")
                                  .getMethod("getBundleUrlForActivityId", 
                                      Int::class.javaPrimitiveType,
                                      String::class.java, 
                                      String::class.java, 
                                      String::class.java, 
                                      Boolean::class.javaPrimitiveType, 
                                      Boolean::class.javaPrimitiveType)
                                  .invoke(null, 
                                      settings.getExponentActivityId(), 
                                      host, 
                                      mainModuleID, 
                                      type.typeID, 
                                      devMode, 
                                      jSMinifyMode) as String
                          } catch (expoHandleErrorException: Exception) {
                              expoHandleErrorException.printStackTrace()
                              return ""
                          }
                      }""";

            content = replaceFunction(content, "createBundleURL", newCreateBundleURLImplementation);
            return content;
        }
    }
}