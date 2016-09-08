package host.exp.exponent.tools;

import com.github.javaparser.ASTHelper;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseException;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.ModifierSet;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.VariableDeclaratorId;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.stmt.EmptyStmt;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.stmt.TryStmt;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.ReferenceType;
import com.github.javaparser.ast.type.Type;
import com.github.javaparser.ast.type.UnionType;
import com.github.javaparser.ast.visitor.ModifierVisitorAdapter;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReactAndroidCodeTransformer {

  private static final String REACT_COMMON_SOURCE_ROOT = "../react-native-lab/react-native/ReactCommon";
  private static final String REACT_COMMON_DEST_ROOT = "android/ReactCommon";
  private static final String REACT_ANDROID_SOURCE_ROOT = "../react-native-lab/react-native/ReactAndroid";
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
        "  } catch (Exception exponentHandleErrorException) {\n" +
        "    exponentHandleErrorException.printStackTrace();\n" + defaultReturnValue +
        "  }\n" +
        "}";
  }

  private static String getHandleErrorBlockString(String throwable, String title, String details, String exceptionId, String isFatal) {
    return getCallMethodReflectionBlock("host.exp.exponent.kernel.Kernel", "\"handleReactNativeError\", Throwable.class, String.class, Object.class, Integer.class, Boolean.class", "null, " + throwable + ", " + title + ", " + details + ", " + exceptionId + ", " + isFatal);
  }

  private static BlockStmt getHandleErrorBlock(String throwable, String title, String details, String exceptionId, String isFatal) {
    try {
      return JavaParser.parseBlock(getHandleErrorBlockString(throwable, title, details, exceptionId, isFatal));
    } catch (ParseException e) {
      e.printStackTrace();
      return null;
    }
  }

  private static CatchClause getCatchClause(String title, String details, String exceptionId, String isFatal) {
    Type t = new ClassOrInterfaceType("RuntimeException");
    VariableDeclaratorId v = new VariableDeclaratorId("exponentException");
    BlockStmt catchBlock = getHandleErrorBlock("exponentException", title, details, exceptionId, isFatal);
    return getCatchClause(Arrays.asList(t), v, catchBlock);
  }

  private static CatchClause getCatchClause() {
    Type t = new ClassOrInterfaceType("Throwable");
    VariableDeclaratorId v = new VariableDeclaratorId("exponentException");
    return getCatchClause(Arrays.asList(t), v, new BlockStmt());
  }

  private static CatchClause getCatchClause(
      List<Type> exceptionTypes,
      VariableDeclaratorId exceptionId,
      BlockStmt catchBlock) {
    List<ReferenceType> referenceTypes = new ArrayList<ReferenceType>();
    for (Type type : exceptionTypes) {
      referenceTypes.add(new ReferenceType(type));
    }
    UnionType type = new UnionType(referenceTypes);
    Parameter exceptionParam = new Parameter(type, exceptionId);
    return new CatchClause(exceptionParam, catchBlock);
  }

  private static TryStmt getTryCatch(Statement statement, String title, String details, String exceptionId, String isFatal) {
    TryStmt tryStatement = new TryStmt();
    BlockStmt tryBlockStatement = new BlockStmt(Arrays.asList(statement));
    tryStatement.setTryBlock(tryBlockStatement);
    tryStatement.setCatchs(Arrays.asList(getCatchClause(title, details, exceptionId, isFatal)));
    return tryStatement;
  }

  private static TryStmt getTryCatch(Statement statement) {
    TryStmt tryStatement = new TryStmt();
    BlockStmt tryBlockStatement = new BlockStmt(Arrays.asList(statement));
    tryStatement.setTryBlock(tryBlockStatement);
    tryStatement.setCatchs(Arrays.asList(getCatchClause()));
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
            try {
              BlockStmt stmt = JavaParser.parseBlock(getCallMethodReflectionBlock("host.exp.exponent.kernel.Kernel", "\"getBundleUrlForActivityId\", int.class, String.class, String.class, boolean.class, boolean.class, boolean.class", "null, mSettings.exponentActivityId, host, jsModulePath, devMode, hmr, jsMinify", "return (String) ", "return null;"));
              n.setBody(stmt);
              n.setModifiers(n.getModifiers() & ~Modifier.STATIC);
              return n;
            } catch (ParseException e) {
              e.printStackTrace();
              return null;
            }
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
        // In dev mode call the original methods. Otherwise open Exponent error screen
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
            try {
              BlockStmt blockStmt = JavaParser.parseBlock("{return mPreferences.getBoolean(PREFS_RELOAD_ON_JS_CHANGE_KEY, true);}");
              n.setBody(blockStmt);
              return n;
            } catch (ParseException e) {
              e.printStackTrace();
              return null;
            }
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
    String projectRoot = new File(executionPath + "../../../../../").getCanonicalPath() + '/';

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

    // Sourceforge is slow. Use our copy in S3
    replaceInFile(new File(projectRoot + REACT_ANDROID_DEST_ROOT + "/build.gradle"),
        "https://downloads.sourceforge.net/project/boost/boost/1.57.0/boost_1_57_0.zip",
        "http://exp-us-standard.s3.amazonaws.com/boost_1_57_0.zip");

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
      content = content.replaceAll(searchString, replaceString);
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

    FileOutputStream out = new FileOutputStream(path);
    if (methodVisitor != null) {
      out.write(methodVisitor.modifySource(cu.toString()).getBytes());
    } else {
      out.write(cu.toString().getBytes());
    }
    out.close();
  }

  private static class ChangerVisitor extends ModifierVisitorAdapter<Void> {

    MethodVisitor mMethodVisitor;

    ChangerVisitor(MethodVisitor methodVisitor) {
      mMethodVisitor = methodVisitor;
    }

    @Override
    public Node visit(final ClassOrInterfaceDeclaration n, final Void arg) {
      super.visit(n, arg);

      // Remove all final modifiers
      n.setModifiers(n.getModifiers() & ~Modifier.FINAL);

      String className = n.getName();
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

      String name = n.getName();
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
      if ((n.getModifiers() & Modifier.STATIC) != 0) {
        n.setModifiers(n.getModifiers() & ~Modifier.FINAL);
      }

      n.setModifiers(n.getModifiers() & ~Modifier.PRIVATE & ~Modifier.PROTECTED | Modifier.PUBLIC);

      if (n.toString().contains("public static String DATABASE_NAME")) {
        n.setModifiers(n.getModifiers() & ~Modifier.STATIC);
      }

      return n;
    }

    @Override
    public Node visit(final MethodDeclaration n, final Void arg) {
      super.visit(n, arg);

      String methodName = n.getName();
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
    } else if (node.getChildrenNodes().size() > 0) {
      List<Node> childrenNodes = new ArrayList<>(node.getChildrenNodes());
      for (Node child : childrenNodes) {
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
    List<Statement> newStatements = new ArrayList<>();
    for (Statement statement : body.getStmts()) {
      newStatements.add((Statement) mapNode(statement, mapper));
    }
    body.setStmts(newStatements);
    return body;
  }

  private static Node mapBlockStatement(final MethodDeclaration n, final StatementMapper mapper) {
    BlockStmt body = n.getBody();
    body = mapBlockStatement(body, mapper);
    n.setBody(body);

    return n;
  }

  private static Node mapBlockStatement(final ConstructorDeclaration n, final StatementMapper mapper) {
    BlockStmt body = n.getBlock();
    body = mapBlockStatement(body, mapper);
    n.setBlock(body);

    return n;
  }

  private static Node handleReloadJS(final MethodDeclaration n) {
    return mapBlockStatement(n, new StatementMapper() {
      @Override
      public Statement map(Statement statement) {
        if (!statement.toString().contains("progressDialog.show();")) {
          return statement;
        }

        return getTryCatch(statement, "\"Must allow Exponent to draw over other apps in dev mode.\"", "null", "-1", "true");
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

        return getTryCatch(statement, "exponentException.getMessage()", "null", "-1", "true");
      }
    });
  }

  private static Node exceptionsManagerModuleHandleException(final MethodDeclaration n, final String isFatal) {
    String source = "{\nif (mDevSupportManager.getDevSupportEnabled()) {\n" +
        n.getBody().toString() + "\n" +
        "} else {\n" +
        getHandleErrorBlockString("null", "title", "details", "exceptionId", isFatal) + "\n" +
        "}\n}\n";

    try {
      BlockStmt blockStmt = JavaParser.parseBlock(source);
      n.setBody(blockStmt);
      return n;
    } catch (ParseException e) {
      e.printStackTrace();
      return null;
    }
  }

  private static Node hasUpToDateJSBundleInCache(final MethodDeclaration n) {
    try {
      BlockStmt blockStmt = JavaParser.parseBlock("{\nreturn false;\n}");
      n.setBody(blockStmt);
      return n;
    } catch (ParseException e) {
      e.printStackTrace();
      return null;
    }
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
    try {
      // ReactDatabaseSupplier(Context context)
      {
        ConstructorDeclaration c = new ConstructorDeclaration(ModifierSet.PUBLIC, "ReactDatabaseSupplier");

        List<Parameter> parameters = new ArrayList<>();
        parameters.add(ASTHelper.createParameter(ASTHelper.createReferenceType("Context", 0), "context"));
        c.setParameters(parameters);

        BlockStmt block = new BlockStmt();
        List<Expression> superArgs = new ArrayList<>();
        superArgs.add(JavaParser.parseExpression("context"));
        superArgs.add(JavaParser.parseExpression("\"RKStorage\""));
        superArgs.add(JavaParser.parseExpression("null"));
        superArgs.add(JavaParser.parseExpression("DATABASE_VERSION"));

        MethodCallExpr call = new MethodCallExpr(null, "super", superArgs);
        ASTHelper.addStmt(block, call);
        ASTHelper.addStmt(block, JavaParser.parseExpression("mContext = context;"));
        ASTHelper.addStmt(block, JavaParser.parseExpression("DATABASE_NAME = \"RKStorage\";"));

        c.setBlock(block);

        ASTHelper.addMember(n, c);
      }

      // ReactDatabaseSupplier(Context context, String databaseName)
      {
        ConstructorDeclaration c = new ConstructorDeclaration(ModifierSet.PUBLIC, "ReactDatabaseSupplier");

        List<Parameter> parameters = new ArrayList<>();
        parameters.add(ASTHelper.createParameter(ASTHelper.createReferenceType("Context", 0), "context"));
        parameters.add(ASTHelper.createParameter(ASTHelper.createReferenceType("String", 0), "databaseName"));
        c.setParameters(parameters);

        BlockStmt block = new BlockStmt();
        List<Expression> superArgs = new ArrayList<>();
        superArgs.add(JavaParser.parseExpression("context"));
        superArgs.add(JavaParser.parseExpression("databaseName"));
        superArgs.add(JavaParser.parseExpression("null"));
        superArgs.add(JavaParser.parseExpression("DATABASE_VERSION"));

        MethodCallExpr call = new MethodCallExpr(null, "super", superArgs);
        ASTHelper.addStmt(block, call);
        ASTHelper.addStmt(block, JavaParser.parseExpression("mContext = context;"));
        ASTHelper.addStmt(block, JavaParser.parseExpression("DATABASE_NAME = databaseName;"));

        c.setBlock(block);

        ASTHelper.addMember(n, c);
      }
    } catch (ParseException e) {
      e.printStackTrace();
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
    BlockStmt body = n.getBody();
    Statement tryCatch = getTryCatch(body);
    body = new BlockStmt();
    List<Statement> statements = new ArrayList<>();
    statements.add(tryCatch);
    body.setStmts(statements);
    n.setBody(body);

    return n;
  }

  private static Node wrapInTryCatchAndHandleError(final MethodDeclaration n) {
    BlockStmt body = n.getBody();
    Statement tryCatch = getTryCatch(body, "exponentException.getMessage()", "null", "-1", "true");
    body = new BlockStmt();
    List<Statement> statements = new ArrayList<>();
    statements.add(tryCatch);
    body.setStmts(statements);
    n.setBody(body);

    return n;
  }
}
