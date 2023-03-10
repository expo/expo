package abi48_0_0.host.exp.exponent.modules.api.components.maps;

import android.annotation.SuppressLint;
import android.content.Context;
import android.location.Location;
import android.os.Looper;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.maps.LocationSource;
import com.google.android.gms.tasks.OnSuccessListener;

import java.lang.SecurityException;

public class FusedLocationSource implements LocationSource {

    private final FusedLocationProviderClient fusedLocationClientProviderClient;
    private final LocationRequest locationRequest;
    private LocationCallback locationCallback;

    public FusedLocationSource(Context context){
        fusedLocationClientProviderClient =
                LocationServices.getFusedLocationProviderClient(context);
        locationRequest = LocationRequest.create();
        locationRequest.setPriority(Priority.PRIORITY_HIGH_ACCURACY);
        locationRequest.setInterval(5000);
    }

    public void setPriority(int priority){
        locationRequest.setPriority(priority);
    }

    public void setInterval(int interval){
        locationRequest.setInterval(interval);
    }

    public void setFastestInterval(int fastestInterval){
        locationRequest.setFastestInterval(fastestInterval);
    }

    @SuppressLint("MissingPermission")
    @Override
    public void activate(final OnLocationChangedListener onLocationChangedListener) {
        try {
            fusedLocationClientProviderClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
                @Override
                public void onSuccess(Location location) {
                    if (location != null) {
                        onLocationChangedListener.onLocationChanged(location);
                    }
                }
            });
            locationCallback = new LocationCallback() {
                @Override
                public void onLocationResult(LocationResult locationResult) {
                    for (Location location : locationResult.getLocations()) {
                        onLocationChangedListener.onLocationChanged(location);
                    }
                }
            };
            fusedLocationClientProviderClient.requestLocationUpdates(locationRequest, locationCallback, Looper.myLooper());
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void deactivate() {
        fusedLocationClientProviderClient.removeLocationUpdates(locationCallback);
    }
}
