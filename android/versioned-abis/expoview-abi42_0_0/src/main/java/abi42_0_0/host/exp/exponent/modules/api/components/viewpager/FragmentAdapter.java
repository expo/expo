package abi42_0_0.host.exp.exponent.modules.api.components.viewpager;

import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;


import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FragmentAdapter extends FragmentStateAdapter {
    private List<View> childrenViews = new ArrayList<>();
    public FragmentAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
    }


    @NonNull
    @Override
    public Fragment createFragment(int position) {
        return new ViewPagerFragment(childrenViews.get(position));
    }

    @Override
    public int getItemCount() {
        return childrenViews.size();
    }

    @Override
    public long getItemId(int position) {
        return childrenViews.get(position).getId();
    }

    @Override
    public boolean containsItem(long itemId) {
        for(View child: childrenViews) {
            if((int) itemId == child.getId()) {
                return true;
            }
        }
        return false;
    }

    public void addFragment(View child, int index) {
        childrenViews.add(index, child);
        notifyItemInserted(index);
    }

    public void removeFragment(View child) {
        int index = childrenViews.indexOf(child);
        removeFragmentAt(index);
    }

    public void removeFragmentAt(int index) {
        childrenViews.remove(index);
        notifyItemRemoved(index);
    }

    public void removeAll() {
        childrenViews.clear();
        notifyDataSetChanged();
    }

    public View getChildViewAt(int index) {
        return childrenViews.get(index);
    }
}
