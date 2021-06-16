package abi42_0_0.host.exp.exponent.modules.api.components.viewpager;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class ViewPagerFragment extends Fragment {
    View view;

    public ViewPagerFragment(View child) {
        view = child;
    }

    public ViewPagerFragment() {}

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return view != null ? view : new View(getContext());
    }
}
