// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.oauth;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.view.MenuItem;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.facebook.infer.annotation.Assertions;

import host.exp.expoview.R;

public class OAuthWebViewActivity extends AppCompatActivity {
    public final static String DATA_URL = "url";
    public final static String DATA_RESULT_URL = "result_url";

    private final static String OAUTH_CALLBACK_URL_PATTERN = "https://oauth.host.exp.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.oauth_webview_activity);

        Toolbar toolbar = Assertions.assertNotNull((Toolbar) findViewById(R.id.toolbar));
        setSupportActionBar(toolbar);

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle("");
            actionBar.setDisplayHomeAsUpEnabled(true);
            actionBar.setDisplayShowHomeEnabled(true);
        }

        WebView webView = Assertions.assertNotNull((WebView) findViewById(R.id.webview));
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith(OAUTH_CALLBACK_URL_PATTERN)) {
                    processCallback(url);
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, url);
            }
        });

        Intent intent = getIntent();
        webView.loadUrl(intent.getStringExtra(DATA_URL));
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            setResult(RESULT_CANCELED);
            finish();
        }

        return super.onOptionsItemSelected(item);
    }

    private void processCallback(String urlString) {
        Intent result = new Intent();
        result.putExtra(DATA_RESULT_URL, urlString);
        setResult(RESULT_OK, result);
        finish();
    }
}
