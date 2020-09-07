package abi39_0_0.host.exp.exponent.modules.api.components.viewpager;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class ViewPagerFragment extends Fragment {

    public static String CHILD_VIEW_KEY = "CHILD_VIEW_KEY";

    public static ViewPagerFragment newInstance(int id) {
        Bundle args = new Bundle();
        args.putInt(CHILD_VIEW_KEY, id);
        ViewPagerFragment fragment = new ViewPagerFragment();
        fragment.setArguments(args);
        return fragment;
    }


    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return ReactViewPagerManager.reactChildrenViews.get(getArguments().getInt(CHILD_VIEW_KEY));
    }
}
