
import android.content.ContentResolver;
import android.database.CrossProcessCursorWrapper;
import android.database.Cursor;
import android.net.Uri;

import com.facebook.jni.HybridData;
import com.facebook.react.BuildConfig;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import versioned.host.exp.exponent.modules.api.ContactsModule;

import static org.mockito.Matchers.any;
import static org.mockito.Mockito.verify;
import static org.powermock.api.mockito.PowerMockito.*;

@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@Config(constants = BuildConfig.class)
public class ContactsModuleTest {

    @Rule
    public PowerMockRule rule = new PowerMockRule();

    private ContactsModule sut;

    ReadableMap mockMap;

    Promise mockPromise;

    ContentResolver mockCr;

    ReactApplicationContext mockContext;

    @Before
    public void runBefore() {
        mockMap = mock(ReadableMap.class);
        mockPromise = mock(Promise.class);
        mockContext = mock(ReactApplicationContext.class);
        mockCr = mock(ContentResolver.class);

        when(mockCr.query(any(Uri.class), any(String[].class), any(String.class),
                any(String[].class), any(String.class))).thenReturn(new CrossProcessCursorWrapper(mock(Cursor.class)) {
        });

        when(mockContext.getContentResolver()).thenReturn(mockCr);
        sut = new ContactsModule(mockContext);

        PowerMockito.mockStatic(Arguments.class);
        Answer<Object> stubArray = new Answer<Object>() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyArray();
            }
        };
        Answer<Object> stubMap = new Answer<Object>() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
            }
        };
        PowerMockito.when(Arguments.createArray()).thenAnswer(stubArray);
        PowerMockito.when(Arguments.createMap()).thenAnswer(stubMap);
    }

    @Test
    public void emailValidator_CorrectEmailSimple_ReturnsTrue() {
        //given
        when(mockMap.getInt("pageOffset")).thenReturn(0);
        when(mockMap.getInt("pageSize")).thenReturn(100);
        when(mockMap.getArray("fields")).thenReturn(new JavaOnlyArray());
        //when
         sut.getContactsAsync(mockMap, mockPromise);
        //then
        verify(mockPromise).reject("E_MISSING_PERMISSION", "Missing contacts permission.");
    }
}