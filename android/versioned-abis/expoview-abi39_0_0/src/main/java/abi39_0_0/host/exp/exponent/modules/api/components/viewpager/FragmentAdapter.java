package abi39_0_0.host.exp.exponent.modules.api.components.viewpager;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;

import com.reactnative.community.viewpager2.adapter.FragmentStateAdapter;

import java.util.ArrayList;

public class FragmentAdapter extends FragmentStateAdapter {

    public FragmentAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
    }

    private ArrayList<Integer> childrenViewIDs = new ArrayList<>();

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        return ViewPagerFragment.newInstance(childrenViewIDs.get(position));
    }

    @Override
    public int getItemCount() {
        return childrenViewIDs.size();
    }

    @Override
    public long getItemId(int position) {
        return childrenViewIDs.get(position);
    }

    @Override
    public boolean containsItem(long itemId) {
        return childrenViewIDs.contains((int) itemId);
    }

    public void addFragment(View child, int index) {
        childrenViewIDs.add(index, child.getId());
        notifyItemInserted(index);
    }

    public void removeFragment(View child) {
        int index = childrenViewIDs.indexOf(child.getId());
        removeFragmentAt(index);
    }

    public void removeFragmentAt(int index) {
        childrenViewIDs.remove(index);
        notifyItemRemoved(index);
    }

    public void removeAll() {
        childrenViewIDs.clear();
        notifyDataSetChanged();
    }

    public int getChildViewIDAt(int index) {
        return childrenViewIDs.get(index);
    }
}
