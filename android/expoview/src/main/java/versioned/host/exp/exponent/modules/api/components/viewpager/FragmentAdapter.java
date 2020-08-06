package versioned.host.exp.exponent.modules.api.components.viewpager;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;


import com.reactnative.community.viewpager2.adapter.FragmentStateAdapter;

import java.util.ArrayList;

import static versioned.host.exp.exponent.modules.api.components.viewpager.ViewPagerFragment.CHILD_VIEW_KEY;

public class FragmentAdapter extends FragmentStateAdapter {

    public FragmentAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
    }

    private ArrayList<ViewPagerFragment> children = new ArrayList<>();

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        return children.get(position);
    }

    @Override
    public int getItemCount() {
        return children.size();
    }

    public void addFragment(View child, int index) {
        children.add(ViewPagerFragment.newInstance(child.getId()));
        notifyItemChanged(index);
    }


    public void removeFragment(View child) {
        for (int i = 0; i < children.size(); i++) {
            Fragment fragment = children.get(i);
            int viewID = fragment.getArguments().getInt(CHILD_VIEW_KEY);
            if (viewID == child.getId()) {
                children.remove(i);
                notifyItemRemoved(i);
                return;
            }
        }
    }

    public void removeFragmentAt(int index) {
        children.remove(index);
        notifyItemRemoved(index);
    }


    public void removeAll() {
        children.clear();
        notifyDataSetChanged();
    }

    public ArrayList<ViewPagerFragment> getChildren() {
        return children;
    }

    public View getChildAt(int index) {
        return children.get(index).getView();
    }
}
