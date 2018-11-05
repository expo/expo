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
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.SimpleName;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.stmt.EmptyStmt;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.stmt.TryStmt;
import com.github.javaparser.ast.type.ReferenceType;
import com.github.javaparser.ast.type.UnionType;
import com.github.javaparser.ast.visitor.ModifierVisitor;

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

  private static final String REACT_COMMON_SOURCE_ROOT = "react-native-lab/react-native/ReactCommon";
  private static final String REACT_COMMON_DEST_ROOT = "android/ReactCommon";
  private static final String REACT_ANDROID_SOURCE_ROOT = "react-native-lab/react-native/ReactAndroid";
  private static final String REACT_ANDROID_DEST_ROOT = "android/ReactAndroid";
  private static final String SOURCE_PATH = "src/main/java/com/facebook/react/";

  private static abstract class MethodVisitor {
    abstract Node visit(final String name, final MethodDeclaration n);
    String modifySource(final String source) {
      return source;
    };
  }

  private static final Map<String, MethodVisitor> FILES_TO_MODIFY = new HashMap<>();

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

  private static String getHandleErrorBlockString(String throwable, String title, String details, String exceptionId, String isFatal) {
    return getCallMethodReflectionBlock("host.exp.exponent.ReactNativeStaticHelpers", "\"handleReactNativeError\", Throwable.class, String.class, Object.class, Integer.class, Boolean.class", "null, " + throwable + ", " + title + ", " + details + ", " + exceptionId + ", " + isFatal);
  }

  private static BlockStmt getHandleErrorBlock(String throwable, String title, String details, String exceptionId, String isFatal) {
    return JavaParser.parseBlock(getHandleErrorBlockString(throwable, title, details, exceptionId, isFatal));
  }

  private static CatchClause getCatchClause(String title, String details, String exceptionId, String isFatal) {
    ReferenceType t = JavaParser.parseClassOrInterfaceType("RuntimeException");
    SimpleName v = new SimpleName("expoException");
    BlockStmt catchBlock = getHandleErrorBlock("expoException", title, details, exceptionId, isFatal);
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
    FILES_TO_MODIFY.put("devsupport/DevServerHelper.java", new MethodVisitor() {

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
                "null, mSettings.exponentActivityId, mainModuleID, type.typeID(), host, getDevMode(), getJSMinifyMode()",
                "return (String) ",
                "return null;"));
            n.setBody(stmt);
            n.getModifiers().remove(Modifier.STATIC);
            return n;
        }

        return n;
      }
    });
    FILES_TO_MODIFY.put("modules/network/OkHttpClientProvider.java", new MethodVisitor() {

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
    FILES_TO_MODIFY.put("devsupport/DevSupportManagerImpl.java", new MethodVisitor() {

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
        }

        return n;
      }
    });
    FILES_TO_MODIFY.put("modules/core/ExceptionsManagerModule.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        // In dev mode call the original methods. Otherwise open Expo error screen
        switch (methodName) {
          case "reportFatalException":
            return exceptionsManagerModuleHandleException(n, "true");
          case "reportSoftException":
            return exceptionsManagerModuleHandleException(n, "false");
          case "updateExceptionMessage":
            return exceptionsManagerModuleHandleException(n, "false");
        }

        return n;
      }
    });
    FILES_TO_MODIFY.put("modules/storage/AsyncStorageModule.java", null);
    FILES_TO_MODIFY.put("modules/storage/ReactDatabaseSupplier.java", null);
    FILES_TO_MODIFY.put("modules/dialog/DialogModule.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "onHostResume":
            return wrapInTryCatch(n);
        }

        return n;
      }
    });
    FILES_TO_MODIFY.put("modules/network/NetworkingModule.java", null);
    FILES_TO_MODIFY.put("modules/systeminfo/AndroidInfoHelpers.java", null);
    FILES_TO_MODIFY.put("uimanager/NativeViewHierarchyManager.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "updateProperties":
            return wrapInTryCatch(n);
        }

        return n;
      }
    });
    FILES_TO_MODIFY.put("bridge/DefaultNativeModuleCallExceptionHandler.java", new MethodVisitor() {

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
    FILES_TO_MODIFY.put("devsupport/DevInternalSettings.java", new MethodVisitor() {

      @Override
      public Node visit(String methodName, MethodDeclaration n) {
        switch (methodName) {
          case "isReloadOnJSChangeEnabled":
            BlockStmt blockStmt = JavaParser.parseBlock("{return mPreferences.getBoolean(PREFS_RELOAD_ON_JS_CHANGE_KEY, true);}");
            n.setBody(blockStmt);
            return n;
        }

        return n;
      }

      @Override
      public String modifySource(final String source) {
        return addBeforeEndOfClass(source, "public int exponentActivityId = -1;");
      }
    });
  }

  public static void main(final String[] args) throws IOException {
    String executionPath = ReactAndroidCodeTransformer.class.getProtectionDomain().getCodeSource().getLocation().getPath();
    String projectRoot = new File(executionPath + "../../../../../../").getCanonicalPath() + '/';

    // Get current SDK version
    File expoPackageJsonFile = new File(projectRoot + "package.json");
    String expoPackageJsonString = FileUtils.readFileToString(expoPackageJsonFile, "UTF-8");
    JSONObject expoPackageJson = new JSONObject(expoPackageJsonString);
    String sdkVersion = expoPackageJson.getJSONObject("exp").getString("sdkVersion");

    // Don't want to mess up our original copy of ReactCommon and ReactAndroid if something goes wrong.
    File reactCommonDestRoot = new File(projectRoot + REACT_COMMON_DEST_ROOT);
    File reactAndroidDestRoot = new File(projectRoot + REACT_ANDROID_DEST_ROOT);

    // Always remove
    FileUtils.deleteDirectory(reactCommonDestRoot);
    reactCommonDestRoot = new File(projectRoot + REACT_COMMON_DEST_ROOT);
    FileUtils.deleteDirectory(reactAndroidDestRoot);
    reactAndroidDestRoot = new File(projectRoot + REACT_ANDROID_DEST_ROOT);

    FileUtils.copyDirectory(new File(projectRoot + REACT_COMMON_SOURCE_ROOT), reactCommonDestRoot);
    FileUtils.copyDirectory(new File(projectRoot + REACT_ANDROID_SOURCE_ROOT), reactAndroidDestRoot);

    // Update release.gradle
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/release.gradle"),
        "'https://oss.sonatype.org/service/local/staging/deploy/maven2/'",
        "\"file:${System.env.HOME}/.m2/repository/\"");

    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/release.gradle"),
        "group = GROUP",
        "group = 'com.facebook.react'");

    // This version also gets updated in android-tasks.js
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/release.gradle"),
        "version = VERSION_NAME",
        "version = '" + sdkVersion + "'");

    // RN uses a weird directory structure for soloader to build with Buck. Change this so that Android Studio doesn't complain.
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle"),
        "'src/main/libraries/soloader'",
        "'src/main/libraries/soloader/java'");

    // Actually modify the files
    String path = projectRoot + REACT_ANDROID_DEST_ROOT + '/' + SOURCE_PATH;
    for (String fileName : FILES_TO_MODIFY.keySet()) {
      try {
        updateFile(path + fileName, FILES_TO_MODIFY.get(fileName));
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

      String className = n.getName().toString();
      switch (className) {
        case "ReactDatabaseSupplier":
          return ReactDatabaseSupplier(n);
      }

      return n;
    }

    @Override
    public Node visit(final ConstructorDeclaration n, final Void arg) {
      // We'll add this back in from ReactDatabaseSupplier.
      if (n.toString().contains("ReactDatabaseSupplier(Context context)")) {
        return null;
      }

      String name = n.getName().toString();
      switch (name) {
        case "NetworkingModule":
          return networkingModuleConstructor(n);
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

      if (n.toString().contains("public static String DATABASE_NAME")) {
        modifiers.remove(Modifier.STATIC);
      }

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

  private static Node exceptionsManagerModuleHandleException(final MethodDeclaration n, final String isFatal) {
    String source =
        "{\n" +
            "if (mDevSupportManager.getDevSupportEnabled()) {\n" +
                n.getBody().get().toString() + "\n" +
            "} else {\n" +
                getHandleErrorBlockString("null", "title", "details", "exceptionId", isFatal) + "\n" +
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
        if (!statement.toString().startsWith("options.put(mApplicationContext.getString(R.string.catalyst_settings)")) {
          return statement;
        }

        return new EmptyStmt();
      }
    });
  }

  private static Node ReactDatabaseSupplier(final ClassOrInterfaceDeclaration n) {
    // ReactDatabaseSupplier(Context context)
    {
      ConstructorDeclaration c = new ConstructorDeclaration(EnumSet.of(Modifier.PUBLIC), "ReactDatabaseSupplier");

      NodeList<Parameter> parameters = NodeList.nodeList(
          new Parameter(JavaParser.parseClassOrInterfaceType("Context"), "context"));
      c.setParameters(parameters);

      BlockStmt block = new BlockStmt();
      NodeList<Expression> superArgs = NodeList.nodeList(
          JavaParser.parseExpression("context"),
          JavaParser.parseExpression("\"RKStorage\""),
          JavaParser.parseExpression("null"),
          JavaParser.parseExpression("DATABASE_VERSION"));

      MethodCallExpr call = new MethodCallExpr(null, "super", superArgs);
      block.addStatement(call);
      block.addStatement(JavaParser.parseStatement("mContext = context;"));
      block.addStatement(JavaParser.parseStatement("DATABASE_NAME = \"RKStorage\";"));

      c.setBody(block);

      n.addMember(c);
    }

    // ReactDatabaseSupplier(Context context, String databaseName)
    {
      ConstructorDeclaration c = new ConstructorDeclaration(EnumSet.of(Modifier.PUBLIC), "ReactDatabaseSupplier");

      NodeList<Parameter> parameters = NodeList.nodeList(
          new Parameter(JavaParser.parseClassOrInterfaceType("Context"), "context"),
          new Parameter(JavaParser.parseClassOrInterfaceType("String"), "databaseName"));
      c.setParameters(parameters);

      BlockStmt block = new BlockStmt();
      NodeList<Expression> superArgs = NodeList.nodeList(
          JavaParser.parseExpression("context"),
          JavaParser.parseExpression("databaseName"),
          JavaParser.parseExpression("null"),
          JavaParser.parseExpression("DATABASE_VERSION"));

      MethodCallExpr call = new MethodCallExpr(null, "super", superArgs);
      block.addStatement(call);
      block.addStatement(JavaParser.parseStatement("mContext = context;"));
      block.addStatement(JavaParser.parseStatement("DATABASE_NAME = databaseName;"));

      c.setBody(block);

      n.addMember(c);
    }

    return n;
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
