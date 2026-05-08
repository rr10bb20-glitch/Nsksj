package com.gametranslator;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

/**
 * FloatingTranslatorService — النسخة المحسّنة
 * ─────────────────────────────────────────────
 * ✅ الزر العائم شفاف جداً لا يعيق اللعب
 * ✅ لوحة النتيجة شفافة ولا تحجب اللمس (FLAG_NOT_TOUCHABLE)
 * ✅ تختفي اللوحة تلقائياً بعد 6 ثواني
 * ✅ ضغط طويل على الزر = إيقاف الخدمة
 * ✅ اللوحة في أعلى الشاشة لا تغطي وسط اللعبة
 */
public class FloatingTranslatorService extends Service {

    private static final String CHANNEL_ID  = "translator_channel";
    private static final int    NOTIF_ID    = 42;
    private static final String TARGET_LANG = "ar";
    private static final long   AUTO_DISMISS_MS = 6_000;

    private WindowManager windowManager;
    private View          floatBtn;
    private View          resultPanel;
    private WindowManager.LayoutParams btnParams;
    private WindowManager.LayoutParams panelParams;

    private boolean  isPanelVisible = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable autoDismissRunnable;

    private int screenW, screenH;

    // شفافية الزر: 0.30 وقت اللعب، 0.90 وقت الاستخدام
    private static final float BTN_ALPHA_IDLE   = 0.30f;
    private static final float BTN_ALPHA_ACTIVE = 0.90f;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        DisplayMetrics dm = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(dm);
        screenW = dm.widthPixels;
        screenH = dm.heightPixels;

        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification());
        buildFloatingButton();
    }

    // ────────────────────────────────────────────
    //  بناء الزر العائم
    // ────────────────────────────────────────────
    private void buildFloatingButton() {
        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        floatBtn = LayoutInflater.from(this).inflate(R.layout.floating_button, null);

        btnParams = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
              | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        );
        btnParams.gravity = Gravity.TOP | Gravity.START;
        btnParams.x = screenW - 160;
        btnParams.y = screenH / 2;

        floatBtn.setAlpha(BTN_ALPHA_IDLE);
        floatBtn.setOnTouchListener(new DragTouchListener());
        windowManager.addView(floatBtn, btnParams);
    }

    // ────────────────────────────────────────────
    //  OCR + ترجمة
    // ────────────────────────────────────────────
    private void captureAndTranslate() {
        cancelAutoDismiss();
        showLoadingPanel();
        setButtonAlpha(BTN_ALPHA_ACTIVE);
        setButtonText("⏳");

        new Thread(() -> {
            try {
                String text = getClipboardText();
                if (text == null || text.isEmpty()) {
                    showError("الحافظة فارغة — انسخ نصاً من اللعبة ثم اضغط الزر");
                    return;
                }
                String translated = translateText(text, TARGET_LANG);
                final String orig  = text;
                final String trans = translated;
                mainHandler.post(() -> {
                    showResultPanel(orig, trans);
                    setButtonAlpha(BTN_ALPHA_IDLE);
                    setButtonText("⚡");
                    scheduleAutoDismiss();
                });
            } catch (Exception e) {
                showError("خطأ: " + e.getMessage());
            }
        }).start();
    }

    // ────────────────────────────────────────────
    //  لوحة النتيجة
    // ────────────────────────────────────────────
    private void removePanel() {
        if (resultPanel != null) {
            try { windowManager.removeView(resultPanel); } catch (Exception ignored) {}
            resultPanel = null;
        }
        isPanelVisible = false;
    }

    private void showLoadingPanel() {
        mainHandler.post(() -> {
            removePanel();
            addPanelToWindow(buildResultView("", "", true));
        });
    }

    private void showResultPanel(String orig, String trans) {
        removePanel();
        addPanelToWindow(buildResultView(orig, trans, false));
        isPanelVisible = true;
    }

    private void addPanelToWindow(View panel) {
        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        resultPanel = panel;
        panelParams = new WindowManager.LayoutParams(
            (int)(screenW * 0.82f),
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            // ★ FLAG_NOT_TOUCHABLE — اللوحة لا تأخذ أي لمس، اللاعب يكمل طبيعي
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
              | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
              | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        );
        // أعلى الشاشة حتى لا تغطي وسط اللعبة
        panelParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        panelParams.y = 48;

        windowManager.addView(resultPanel, panelParams);
        isPanelVisible = true;
    }

    // ────────────────────────────────────────────
    //  بناء View اللوحة
    // ────────────────────────────────────────────
    private View buildResultView(String original, String translated, boolean loading) {
        FrameLayout container = new FrameLayout(this);
        container.setPadding(6, 6, 6, 6);
        container.setAlpha(0.88f); // شفافية اللوحة 88%

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(28, 18, 28, 16);
        card.setBackgroundResource(R.drawable.result_card_bg);

        if (loading) {
            TextView tv = new TextView(this);
            tv.setText("⏳  جاري الترجمة…");
            tv.setTextColor(Color.parseColor("#8ab4f8"));
            tv.setTextSize(13f);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            card.addView(tv);
        } else {
            // النص الأصلي
            addLabel(card, "النص الأصلي", "#4a6a9a");
            TextView origTv = new TextView(this);
            origTv.setText(original.length() > 100 ? original.substring(0, 100) + "…" : original);
            origTv.setTextColor(Color.parseColor("#7a9acd"));
            origTv.setTextSize(12f);
            origTv.setPadding(0, 4, 0, 10);
            card.addView(origTv);

            // فاصل
            View div = new View(this);
            LinearLayout.LayoutParams dp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 1);
            div.setBackgroundColor(Color.parseColor("#1e3060"));
            card.addView(div, dp);

            // الترجمة
            addLabel(card, "الترجمة — العربية", "#5a8aff");
            TextView transTv = new TextView(this);
            transTv.setText(translated);
            transTv.setTextColor(Color.parseColor("#e8f0ff"));
            transTv.setTextSize(19f);
            transTv.setTypeface(Typeface.DEFAULT_BOLD);
            transTv.setLineSpacing(4f, 1.2f);
            transTv.setPadding(0, 8, 0, 0);
            card.addView(transTv);

            // تلميح
            TextView hint = new TextView(this);
            hint.setText("⏱ تختفي بعد 6 ثوانٍ  •  اضغط ⚡ للإغلاق");
            hint.setTextColor(Color.parseColor("#3a5580"));
            hint.setTextSize(9f);
            hint.setPadding(0, 10, 0, 0);
            card.addView(hint);
        }

        container.addView(card);
        return container;
    }

    private void addLabel(LinearLayout parent, String text, String colorHex) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor(colorHex));
        tv.setTextSize(9f);
        tv.setAllCaps(true);
        tv.setLetterSpacing(0.12f);
        tv.setPadding(0, 10, 0, 4);
        parent.addView(tv);
    }

    // ────────────────────────────────────────────
    //  إخفاء اللوحة
    // ────────────────────────────────────────────
    private void hideResultPanel() {
        cancelAutoDismiss();
        mainHandler.post(() -> {
            removePanel();
            setButtonAlpha(BTN_ALPHA_IDLE);
            setButtonText("⚡");
        });
    }

    // ────────────────────────────────────────────
    //  الاختفاء التلقائي
    // ────────────────────────────────────────────
    private void scheduleAutoDismiss() {
        autoDismissRunnable = this::hideResultPanel;
        mainHandler.postDelayed(autoDismissRunnable, AUTO_DISMISS_MS);
    }

    private void cancelAutoDismiss() {
        if (autoDismissRunnable != null) {
            mainHandler.removeCallbacks(autoDismissRunnable);
            autoDismissRunnable = null;
        }
    }

    // ────────────────────────────────────────────
    //  خطأ
    // ────────────────────────────────────────────
    private void showError(String msg) {
        mainHandler.post(() -> {
            hideResultPanel();
            setButtonAlpha(BTN_ALPHA_IDLE);
            setButtonText("⚡");
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
        });
    }

    // ────────────────────────────────────────────
    //  مساعدات الزر
    // ────────────────────────────────────────────
    private void setButtonText(String txt) {
        if (floatBtn == null) return;
        TextView tv = floatBtn.findViewById(R.id.btnText);
        if (tv != null) tv.setText(txt);
    }

    private void setButtonAlpha(float alpha) {
        if (floatBtn != null) floatBtn.setAlpha(alpha);
    }

    // ────────────────────────────────────────────
    //  Clipboard
    // ────────────────────────────────────────────
    private String getClipboardText() {
        try {
            android.content.ClipboardManager cm =
                (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
            if (cm != null && cm.hasPrimaryClip()) {
                android.content.ClipData.Item item = cm.getPrimaryClip().getItemAt(0);
                CharSequence t = item.getText();
                if (t != null) return t.toString().trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    // ────────────────────────────────────────────
    //  ترجمة MyMemory
    // ────────────────────────────────────────────
    private String translateText(String text, String toLang) throws Exception {
        if (text.length() > 500) text = text.substring(0, 500);
        String encoded = URLEncoder.encode(text, "UTF-8");
        String urlStr  = "https://api.mymemory.translated.net/get?q="
            + encoded + "&langpair=en|" + toLang;

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);

        BufferedReader reader = new BufferedReader(
            new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        reader.close();

        JSONObject json = new JSONObject(sb.toString());
        int status = json.getInt("responseStatus");
        if (status != 200) throw new Exception("API error: " + status);
        return json.getJSONObject("responseData").getString("translatedText");
    }

    // ────────────────────────────────────────────
    //  Drag Touch Listener + ضغط قصير / طويل
    // ────────────────────────────────────────────
    private class DragTouchListener implements View.OnTouchListener {
        private int   initX, initY;
        private float touchX, touchY;
        private boolean isDragging = false;
        private long    downTime;
        private static final long LONG_PRESS_MS = 800;

        @Override
        public boolean onTouch(View v, MotionEvent e) {
            switch (e.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    initX  = btnParams.x;
                    initY  = btnParams.y;
                    touchX = e.getRawX();
                    touchY = e.getRawY();
                    isDragging = false;
                    downTime   = System.currentTimeMillis();
                    setButtonAlpha(BTN_ALPHA_ACTIVE);
                    return true;

                case MotionEvent.ACTION_MOVE:
                    float dx = e.getRawX() - touchX;
                    float dy = e.getRawY() - touchY;
                    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                        isDragging = true;
                        btnParams.x = Math.max(0, Math.min(initX + (int)dx, screenW - 120));
                        btnParams.y = Math.max(0, Math.min(initY + (int)dy, screenH - 120));
                        windowManager.updateViewLayout(floatBtn, btnParams);
                    }
                    return true;

                case MotionEvent.ACTION_UP:
                    long elapsed = System.currentTimeMillis() - downTime;
                    if (!isDragging) {
                        if (elapsed >= LONG_PRESS_MS) {
                            // ضغط طويل → إيقاف الخدمة
                            Toast.makeText(FloatingTranslatorService.this,
                                "تم إيقاف مترجم الألعاب ✓", Toast.LENGTH_SHORT).show();
                            stopSelf();
                        } else {
                            // ضغط قصير → ترجمة أو إخفاء
                            if (isPanelVisible) {
                                hideResultPanel();
                            } else {
                                captureAndTranslate();
                            }
                        }
                    } else {
                        setButtonAlpha(BTN_ALPHA_IDLE);
                    }
                    return true;
            }
            return false;
        }
    }

    // ────────────────────────────────────────────
    //  Notification
    // ────────────────────────────────────────────
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "مترجم الألعاب", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("خدمة الترجمة العائمة");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        PendingIntent pi = PendingIntent.getActivity(
            this, 0,
            new Intent(this, MainActivity.class),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⚡ مترجم الألعاب يعمل")
            .setContentText("انسخ نص ← اضغط الزر  •  اضغط طويلاً لإيقاف الخدمة")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    // ────────────────────────────────────────────
    //  Lifecycle
    // ────────────────────────────────────────────
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        cancelAutoDismiss();
        if (floatBtn    != null) try { windowManager.removeView(floatBtn);    } catch (Exception ignored) {}
        if (resultPanel != null) try { windowManager.removeView(resultPanel); } catch (Exception ignored) {}
    }
}
