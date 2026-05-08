package com.gametranslator;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.webkit.JavascriptInterface;

public class ClipboardBridge {

    private final Context context;

    public ClipboardBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public String getText() {
        try {
            ClipboardManager cm = (ClipboardManager)
                context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null && cm.hasPrimaryClip()) {
                ClipData.Item item = cm.getPrimaryClip().getItemAt(0);
                CharSequence text = item.getText();
                if (text != null) return text.toString();
            }
        } catch (Exception ignored) {}
        return "";
    }

    @JavascriptInterface
    public void setText(String text) {
        try {
            ClipboardManager cm = (ClipboardManager)
                context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                ClipData clip = ClipData.newPlainText("translation", text);
                cm.setPrimaryClip(clip);
            }
        } catch (Exception ignored) {}
    }
}
