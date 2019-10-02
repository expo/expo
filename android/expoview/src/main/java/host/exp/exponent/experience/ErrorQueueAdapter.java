package host.exp.exponent.experience;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

import butterknife.BindView;
import butterknife.ButterKnife;
import host.exp.exponent.kernel.ExponentError;
import host.exp.expoview.R;
import host.exp.expoview.R2;

public class ErrorQueueAdapter extends ArrayAdapter<ExponentError> {

  private Context mContext;

  public ErrorQueueAdapter(Context context, List<ExponentError> values) {
    super(context, -1, values);
    mContext = context;
  }

  @Override
  public View getView(int position, View convertView, ViewGroup parent) {
    ViewHolder holder;
    if (convertView == null) {
      convertView = LayoutInflater.from(mContext).inflate(R.layout.error_console_list_item, parent, false);
      holder = new ViewHolder(convertView);
      convertView.setTag(holder);
    } else {
      holder = (ViewHolder) convertView.getTag();
    }
    ExponentError item = getItem(position);
    holder.errorMessageView.setText(mContext.getString(R.string.error_uncaught, item.errorMessage.developerErrorMessage()));

    if (item.stack.length > 0) {
      Bundle bundle = item.stack[0];

      String fileName = "";
      String path = bundle.getString("file");
      if (path != null && path.length() > 0) {
        String file = path.substring(path.lastIndexOf('/') + 1);
        fileName = "@" + file;
      }

      String lineNumber = "";
      Object lineNumberObject = bundle.get("lineNumber");

      if (lineNumberObject instanceof Double) {
        lineNumber = ":" + ((Double) lineNumberObject).intValue();
      } else if (lineNumberObject instanceof Integer) {
        lineNumber = ":" + ((Integer) lineNumberObject).intValue();
      }

      String stacktracePreview = bundle.getString("methodName") + fileName + lineNumber;
      holder.stacktraceView.setText(stacktracePreview);
    }

    String timestampViewText = new SimpleDateFormat("HH:mm:ss", Locale.US).format(item.timestamp);
    if (item.isFatal) {
      timestampViewText += " Fatal Error";
    }
    holder.timestampView.setText(timestampViewText);
    return convertView;
  }

  static class ViewHolder {
    @BindView(R2.id.error_console_item_message) TextView errorMessageView;
    @BindView(R2.id.error_console_item_stack_preview) TextView stacktraceView;
    @BindView(R2.id.error_console_item_timestamp) TextView timestampView;

    public ViewHolder(View view) {
      ButterKnife.bind(this, view);
    }
  }
}
