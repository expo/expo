package expo.modules.location.services;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.PendingIntent.CanceledException;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class GeofenceService extends Service {
    private static final String KEY_UPSTREAM_INTENT = "upstreamIntent";

    public static PendingIntent createIntent(Context context, PendingIntent upstreamIntent) {
        final Intent intent = new Intent(context, GeofenceService.class);
        intent.putExtra(KEY_UPSTREAM_INTENT, upstreamIntent);
        final int flags = Build.VERSION_CODES.S <= Build.VERSION.SDK_INT
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
        return Build.VERSION_CODES.O <= Build.VERSION.SDK_INT
                ? PendingIntent.getForegroundService(context, 0, intent, flags)
                : PendingIntent.getService(context, 0, intent, flags);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION_CODES.O <= Build.VERSION.SDK_INT) {
            final String CHANNEL_ID = "GeofenceService";
            final NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Receive geofence events",
                            NotificationManager.IMPORTANCE_LOW);

            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE))
                    .createNotificationChannel(channel);

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("")
                    .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                    .setContentText("").build();

            startForeground(1, notification);
        }
    }

    public int onStartCommand(Intent intent, int flags, int startId) {
        if (null != intent) {
            try {
                final PendingIntent upstreamIntent = intent.getParcelableExtra(KEY_UPSTREAM_INTENT);
                upstreamIntent.send(this, 0, intent);
            } catch (CanceledException e) {
                // ignored
            }
        }
        stopSelf();
        return START_NOT_STICKY;
    }
}
