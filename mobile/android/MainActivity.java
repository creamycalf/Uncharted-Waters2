package org.local.uw2mobile;
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.*;
import java.io.*;
import java.util.*;

public final class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);getWindow().getDecorView().setSystemUiVisibility(5894);web=new WebView(this);setContentView(web);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(false);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setSupportZoom(false);
  web.setWebChromeClient(new WebChromeClient());web.addJavascriptInterface(new Bridge(),"Android");
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !"appassets.androidplatform.net".equals(r.getUrl().getHost());}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
    if(!"appassets.androidplatform.net".equals(r.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
    String p=r.getUrl().getPath();if(p==null||p.contains(".."))return null;if(p.equals("/"))p="/web/index.html";
    try{String mime="application/octet-stream";if(p.endsWith(".html"))mime="text/html";else if(p.endsWith(".js"))mime="application/javascript";else if(p.endsWith(".css"))mime="text/css";else if(p.endsWith(".json"))mime="application/json";else if(p.endsWith(".wasm"))mime="application/wasm";else if(p.endsWith(".webp"))mime="image/webp";else if(p.endsWith(".png"))mime="image/png";
     return new WebResourceResponse(mime,"UTF-8",getAssets().open(p.substring(1)));
    }catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
   }
  });web.loadUrl("https://appassets.androidplatform.net/web/index.html");
 }
 public final class Bridge {@JavascriptInterface public void exit(){runOnUiThread(()->finish());}}
 @Override public void onBackPressed(){web.evaluateJavascript("!window.__ci?Android.exit():window.K2Mobile?.state().panel?window.K2Mobile.close():window.K2Mobile?.state().deck?window.K2Mobile.closeDeck():window.K2UI?.back()",null);}
 @Override protected void onPause(){web.evaluateJavascript("window.K2Mobile?.cancel();window.K2Lifecycle?.background()",null);super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.evaluateJavascript("window.K2Lifecycle?.foreground()",null);}
 @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("Android");web.destroy();}super.onDestroy();}
}
