package host.exp.exponent.tools;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseException;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.comments.LineComment;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.SimpleName;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.stmt.EmptyStmt;
import com.github.javaparser.ast.stmt.LabeledStmt;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.stmt.TryStmt;
import com.github.javaparser.ast.type.ReferenceType;
import com.github.javaparser.ast.type.UnionType;
import com.github.javaparser.ast.visitor.GenericVisitor;
import com.github.javaparser.ast.visitor.ModifierVisitor;
import com.github.javaparser.ast.visitor.VoidVisitor;

import org.apache.commons.io.FileUtils;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class ReactAndroidCodeTransformer {

  private static final String REACT_ANDROID_DEST_ROOT = "../../react-native-lab/react-native/packages/react-native/ReactAndroid";
  private static final String SOURCE_PATH = "src/main/java/com/facebook/react/";

  private static abstract class MethodVisitor {
    abstract Node visit(final String name, final MethodDeclaration n);
    String modifySource(final String source) {
      return source;
    };
  }

  private static abstract class KtMethodVisitor {
    String modifySource(final String source) {
      return source;
    };
  }

  private static final Map<String, MethodVisitor> JAVA_FILES_TO_MODIFY = new HashMap<>();
  private static final Map<String, KtMethodVisitor> KOTLIN_FILES_TO_MODIFY = new HashMap<>();

  private static String getCallMethodReflectionBlock(String className, String methodNameAndTypes, String targetAndValues) {
    return getCallMethodReflectionBlock(className, methodNameAndTypes, targetAndValues, "", "");
  }

  private static String getCallMethodReflectionBlock(String className, String methodNameAndTypes, String targetAndValues, String returnValue, String defaultReturnValue) {
    return "{\n" +
        "  try {\n" +
        "    " + returnValue + "Class.forName(\"" + className + "\").getMethod(" + methodNameAndTypes + ").invoke(" + targetAndValues + ");\n" +
        "  } catch (Exception expoHandleErrorException) {\n" +
        "    expoHandleErrorException.printStackTrace();\n" + defaultReturnValue +
        "  }\n" +
        "}";
  }

  private static String getHandleErrorBlockString(String title, String details, String exceptionId, String isFatal) {
    return getCallMethodReflectionBlock("host.exp.exponent.ReactNativeStaticHelpers", "\"handleReactNativeError\", String.class, Object.class, Integer.class, Boolean.class", "null, " + title + ", " + details + ", " + exceptionId + ", " + isFatal);
  }

  private static BlockStmt getHandleErrorBlock(String title, String details, String exceptionId, String isFatal) {
    return JavaParser.parseBlock(getHandleErrorBlockString(title, details, exceptionId, isFatal));
  }

  private static CatchClause getCatchClause(String title, String details, String exceptionId, String isFatal) {
    ReferenceType t = JavaParser.parseClassOrInterfaceType("RuntimeException");
    SimpleName v = new SimpleName("expoException");
    BlockStmt catchBlock = getHandleErrorBlock(title, details, exceptionId, isFatal);
    return getCatchClause(Arrays.asList(t), v, catchBlock);
  }

  private static CatchClause getCatchClause() {
    ReferenceType t = JavaParser.parseClassOrInterfaceType("Throwable");
    SimpleName v = new SimpleName("expoException");
    return getCatchClause(Arrays.asList(t), v, new BlockStmt());
  }

  private static CatchClause getCatchClause(
      List<ReferenceType> exceptionTypes,
      SimpleName exceptionId,
      BlockStmt catchBlock) {
    UnionType type = new UnionType(NodeList.nodeList(exceptionTypes));
    Parameter exceptionParam = new Parameter(type, exceptionId);
    return new CatchClause(exceptionParam, catchBlock);
  }

  private static TryStmt getTryCatch(Statement statement, String title, String details, String exceptionId, String isFatal) {
    TryStmt tryStatement = new TryStmt();
    BlockStmt tryBlockStatement = new BlockStmt(NodeList.nodeList(statement));
    tryStatement.setTryBlock(tryBlockStatement);
    tryStatement.setCatchClauses(NodeList.nodeList(getCatchClause(title, details, exceptionId, isFatal)));
    return tryStatement;
  }

  private static TryStmt getTryCatch(Statement statement) {
    TryStmt tryStatement = new TryStmt();
    BlockStmt tryBlockStatement = new BlockStmt(NodeList.nodeList(statement));
    tryStatement.setTryBlock(tryBlockStatement);
    tryStatement.setCatchClauses(NodeList.nodeList(getCatchClause()));
    return tryStatement;
  }

  private static String addBeforeEndOfClass(final String source, final String add) {
    int endOfClass = source.lastIndexOf("}");
    return source.substring(0, endOfClass) + "\n" + add + "\n" + source.substring(endOfClass);
  }

  static {
    JAVA_FILES_TO_MODIFY.put("devsupport/DevServerHelper.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "createBundleURL":
            // In RN 0.54 this method is overloaded; skip the convenience version
            NodeList<Parameter> params = n.getParameters();
            if (params.size() == 2 && params.get(0).getNameAsString().equals("mainModuleID") &&
                params.get(1).getNameAsString().equals("type")) {
              return n;
            }

            BlockStmt stmt = JavaParser.parseBlock(getCallMethodReflectionBlock(
                "host.exp.exponent.ReactNativeStaticHelpers",
                "\"getBundleUrlForActivityId\", int.class, String.class, String.class, String.class, boolean.class, boolean.class",
                "null, mSettings.getExponentActivityId(), host, mainModuleID, type.typeID(), getDevMode(), getJSMinifyMode()",
                "return (String) ",
                "return null;"));
            n.setBody(stmt);
            n.getModifiers().remove(Modifier.STATIC);
            return n;
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("modules/network/OkHttpClientProvider.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "createClient":
            BlockStmt stmt = JavaParser.parseBlock(getCallMethodReflectionBlock(
                "host.exp.exponent.ReactNativeStaticHelpers",
                "\"getOkHttpClient\", Class.class",
                "null, OkHttpClientProvider.class",
                "return (OkHttpClient) ",
                "return null;"));
            n.setBody(stmt);
            return n;
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("devsupport/DevSupportManagerBase.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "handleReloadJS":
            // Catch error if "draw over other apps" not enabled
            return handleReloadJS(n);
          case "handleException":
            // Handle any uncaught error in original method
            return handleException(n);
          case "hasUpToDateJSBundleInCache":
            // Use this to always force a refresh in debug mode.
            return hasUpToDateJSBundleInCache(n);
          case "showDevOptionsDialog":
            return showDevOptionsDialog(n);
          case "getExponentActivityId":
            n.setBody(JavaParser.parseBlock("{return mDevServerHelper.mSettings.getExponentActivityId();}"));
            return n;
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("devsupport/BridgeDevSupportManager.java", null);

    KOTLIN_FILES_TO_MODIFY.put("modules/core/ExceptionsManagerModule.kt", new KtMethodVisitor() {

      public Node visit(String methodName, MethodDeclaration n) {
        // In dev mode call the original methods. Otherwise open Expo error screen
        switch (methodName) {
          case "reportFatalException":
            return exceptionsManagerModuleHandleException(n, "message", "stack", "(int) idDouble", "true");
          case "reportSoftException":
            return exceptionsManagerModuleHandleException(n, "message", "stack", "(int) idDouble", "false");
          case "updateExceptionMessage":
            return exceptionsManagerModuleHandleException(n, "title", "details", "(int) exceptionIdDouble", "false");
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("modules/dialog/DialogModule.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "onHostResume":
            return wrapInTryCatch(n);
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("modules/network/NetworkingModule.java", null);
    JAVA_FILES_TO_MODIFY.put("modules/systeminfo/AndroidInfoHelpers.java", null);
    JAVA_FILES_TO_MODIFY.put("uimanager/NativeViewHierarchyManager.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "updateProperties":
            return wrapInTryCatch(n);
        }

        return n;
      }
    });
    JAVA_FILES_TO_MODIFY.put("bridge/DefaultJSExceptionHandler.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "handleException":
            // Catch any uncaught exceptions
            return wrapInTryCatchAndHandleError(n);
        }

        return n;
      }
    });
    KOTLIN_FILES_TO_MODIFY.put("devsupport/DevInternalSettings.kt", new KtMethodVisitor() {

      @Override
      String modifySource(String source) {
        // Make DevInternalSettings class "public"
        source = source.replace("\ninternal class DevInternalSettings", "\npublic class DevInternalSettings");

        return addBeforeEndOfClass(source, """
          private var exponentActivityId: Int = -1

          public fun setExponentActivityId(value: Int) {
             exponentActivityId = value
          }

          public override fun getExponentActivityId(): Int {
            return exponentActivityId
          }
        """);
      }
    });

    KOTLIN_FILES_TO_MODIFY.put("modules/debug/interfaces/DeveloperSettings.kt", new KtMethodVisitor() {

      @Override
      String modifySource(String source) {
        return addBeforeEndOfClass(source, "public fun getExponentActivityId(): Int");
      }
    });

    JAVA_FILES_TO_MODIFY.put("BaseReactPackage.java", new MethodVisitor() {

        @Override
      public Node visit(String methodName, MethodDeclaration n) {
        if (methodName.equals("getNativeModuleIterator")) {
          n.setPublic(true);
          return n;
        }

        return n;
      }
    });
  }

  public static void main(final String[] args) throws IOException {
    String executionPath = ReactAndroidCodeTransformer.class.getProtectionDomain().getCodeSource().getLocation().getPath();
    String projectRoot = new File(executionPath + "../../../../../../").getCanonicalPath() + '/';

    String sdkVersion;
    try {
      sdkVersion = args[0];
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid args passed in, expected one argument -- SDK version.");
    }

    // Update maven publish information
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle.kts"),
        "def AAR_OUTPUT_URL = \"file://${projectDir}/../android\"",
        "def AAR_OUTPUT_URL = \"file:${System.env.HOME}/.m2/repository\"");

    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle.kts"),
        "group = GROUP",
        "group = \"com.facebook.react\"");

    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle.kts"),
            "$rootDir/node_modules/@react-native/codegen",
            "${project(\":packages:react-native:ReactAndroid\").projectDir.parent}/../react-native-codegen");

    // RN uses a weird directory structure for soloader to build with Buck. Change this so that Android Studio doesn't complain.
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle.kts"),
        "'src/main/libraries/soloader'",
        "'src/main/libraries/soloader/java'");

    // Actually modify the files
    String path = projectRoot + REACT_ANDROID_DEST_ROOT + '/' + SOURCE_PATH;
    for (String fileName : JAVA_FILES_TO_MODIFY.keySet()) {
      try {
        updateFile(path + fileName, JAVA_FILES_TO_MODIFY.get(fileName));
      } catch (ParseException e) {
        e.printStackTrace();
      }
    }

    for (String fileName : KOTLIN_FILES_TO_MODIFY.keySet()) {
      try {
        updateKotlinFile(path + fileName, KOTLIN_FILES_TO_MODIFY.get(fileName));
      } catch (ParseException e) {
        e.printStackTrace();
      }
    }
  }

  private static void replaceInFile(final File file, final String searchString, final String replaceString) {
    try {
      String content = FileUtils.readFileToString(file, "UTF-8");
      content = content.replace(searchString, replaceString);
      FileUtils.writeStringToFile(file, content, "UTF-8");
    } catch (IOException e) {
      throw new RuntimeException("Generating file failed", e);
    }
  }

  private static void updateFile(final String path, final MethodVisitor methodVisitor) throws IOException, ParseException {
    FileInputStream in = new FileInputStream(path);
    CompilationUnit cu = JavaParser.parse(in);
    in.close();

    new ChangerVisitor(methodVisitor).visit(cu, null);

    try (OutputStream out = new FileOutputStream(path)) {
      if (methodVisitor != null) {
        out.write(methodVisitor.modifySource(cu.toString()).getBytes());
      } else {
        out.write(cu.toString().getBytes());
      }
    }
  }

  private static void updateKotlinFile(final String path, final KtMethodVisitor methodVisitor) throws IOException, ParseException {
    FileInputStream in = new FileInputStream(path);
    String content = new String(in.readAllBytes());
    in.close();

    try (FileOutputStream out = new FileOutputStream(path)) {
        if (methodVisitor != null) {
            out.write(methodVisitor.modifySource(content).getBytes());
        } else {
            out.write(content.getBytes());
        }
    }
  }

  private static class ChangerVisitor extends ModifierVisitor<Void> {

    MethodVisitor mMethodVisitor;

    ChangerVisitor(MethodVisitor methodVisitor) {
      mMethodVisitor = methodVisitor;
    }

    @Override
    public Node visit(final ClassOrInterfaceDeclaration n, final Void arg) {
      super.visit(n, arg);

      // Remove all final modifiers
      n.getModifiers().remove(Modifier.FINAL);

      return n;
    }

    @Override
    public Node visit(final ConstructorDeclaration n, final Void arg) {
      String name = n.getName().toString();
      switch (name) {
        case "NetworkingModule":
          return networkingModuleConstructor(n);
        case "BridgeDevSupportManager":
          return bridgeDevSupportManagerConstructor(n);
      }

      return n;
    }

    @Override
    public Node visit(final FieldDeclaration n, final Void arg) {
      super.visit(n, arg);

      // Remove all final modifiers from static fields
      EnumSet<Modifier> modifiers = n.getModifiers();
      if (modifiers.contains(Modifier.STATIC) && !n.toString().contains("String NAME")) {
        modifiers.remove(Modifier.FINAL);
      }

      modifiers.remove(Modifier.PRIVATE);
      modifiers.remove(Modifier.PROTECTED);
      modifiers.add(Modifier.PUBLIC);

      n.setModifiers(modifiers);
      return n;
    }

    @Override
    public Node visit(final MethodDeclaration n, final Void arg) {
      super.visit(n, arg);

      String methodName = n.getName().toString();
      if (mMethodVisitor != null) {
        return mMethodVisitor.visit(methodName, n);
      }

      return n;
    }
  }

  private interface StatementMapper {
    Statement map(Statement statement);
  }

  private static Node mapNode(final Node node, final StatementMapper mapper) {
    if (node instanceof BlockStmt) {
      return mapBlockStatement((BlockStmt) node, mapper);
    } else if (node.getChildNodes().size() > 0) {
      List<Node> childNodes = new ArrayList<>(node.getChildNodes());
      for (Node child : childNodes) {
        child.setParentNode(null);
        mapNode(child, mapper).setParentNode(node);
      }

      if (node instanceof Statement) {
        return mapper.map((Statement) node);
      } else {
        return node;
      }
    } else if (node instanceof Statement) {
      return mapper.map((Statement) node);
    } else {
      return node;
    }
  }

  private static BlockStmt mapBlockStatement(final BlockStmt body, final StatementMapper mapper) {
    NodeList<Statement> newStatements = new NodeList<>();
    for (Statement statement : body.getStatements()) {
      newStatements.add((Statement) mapNode(statement, mapper));
    }
    body.setStatements(newStatements);
    return body;
  }

  private static Node mapBlockStatement(final MethodDeclaration n, final StatementMapper mapper) {
    n.getBody().ifPresent(body -> {
      body = mapBlockStatement(body, mapper);
      n.setBody(body);
    });

    return n;
  }

  private static Node mapBlockStatement(final ConstructorDeclaration n, final StatementMapper mapper) {
    BlockStmt body = n.getBody();
    body = mapBlockStatement(body, mapper);
    n.setBody(body);

    return n;
  }

  private static Node handleReloadJS(final MethodDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (!statement.toString().contains("progressDialog.show();")) {
          return statement;
        }

        return getTryCatch(statement, "\"Must allow Expo to draw over other apps in dev mode.\"", "null", "-1", "true");
      }
    });
  }

  private static Node handleException(final MethodDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (!statement.toString().startsWith("if (mIsDevSupportEnabled) {")) {
          return statement;
        }

        return getTryCatch(statement, "expoException.getMessage()", "null", "-1", "true");
      }
    });
  }

  private static Node exceptionsManagerModuleHandleException(final MethodDeclaration n, final String errorMessageName, final String errorDetailsName, final String errorIdName, final String isFatal) {
    String source =
        "{\n" +
            "if (mDevSupportManager.getDevSupportEnabled()) {\n" +
                n.getBody().get().toString() + "\n" +
            "} else {\n" +
                getHandleErrorBlockString(errorMessageName, errorDetailsName, errorIdName, isFatal) + "\n" +
            "}\n" +
        "}\n";

    BlockStmt blockStmt = JavaParser.parseBlock(source);
    n.setBody(blockStmt);
    return n;
  }

  private static Node hasUpToDateJSBundleInCache(final MethodDeclaration n) {
    BlockStmt blockStmt = JavaParser.parseBlock("{\nreturn false;\n}");
    n.setBody(blockStmt);
    return n;
  }

  private static Node showDevOptionsDialog(final MethodDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (statement instanceof LabeledStmt) {
          LabeledStmt labeledStmt = (LabeledStmt) statement;
          if ("expo_transformer_remove".equals(labeledStmt.getLabel().getIdentifier())) {
            Statement emptyStatement = new EmptyStmt();
            emptyStatement.setLineComment(" code removed by ReactAndroidCodeTransformer");
            return emptyStatement;
          }
        }

        return statement;
      }
    });
  }

  // Remove stetho. Otherwise a stetho interceptor gets added each time a new NetworkingModule
  // is created.
  private static Node networkingModuleConstructor(final ConstructorDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (!statement.toString().equals("mClient.networkInterceptors().add(new StethoInterceptor());")) {
          return statement;
        }

        return new EmptyStmt();
      }
    });
  }

  // Remove some custom dev options. unlike `showDevOptionsDialog`, this happens in constructor.
  private static Node bridgeDevSupportManagerConstructor(final ConstructorDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (statement instanceof LabeledStmt) {
          LabeledStmt labeledStmt = (LabeledStmt) statement;
          if ("expo_transformer_remove".equals(labeledStmt.getLabel().getIdentifier())) {
            Statement emptyStatement = new EmptyStmt();
            emptyStatement.setLineComment(" code removed by ReactAndroidCodeTransformer");
            return emptyStatement;
          }
        }

        return statement;
      }
    });
  }

  private static Node wrapInTryCatch(final MethodDeclaration n) {
    n.getBody().ifPresent(body -> {
      Statement tryCatch = getTryCatch(body);
      NodeList<Statement> statements = NodeList.nodeList(tryCatch);
      body = new BlockStmt(statements);
      n.setBody(body);
    });

    return n;
  }

  private static Node wrapInTryCatchAndHandleError(final MethodDeclaration n) {
    n.getBody().ifPresent(body -> {
      Statement tryCatch = getTryCatch(body, "expoException.getMessage()", "null", "-1", "true");
      NodeList<Statement> statements = NodeList.nodeList(tryCatch);
      body = new BlockStmt(statements);
      n.setBody(body);
    });

    return n;
  }
}
