package expo.modules.payments.stripe.dialog;

import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DialogFragment;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.content.Context;
import android.text.TextUtils;

import com.devmarvel.creditcardentry.fields.SecurityCodeText;
import com.devmarvel.creditcardentry.library.CreditCard;
import com.devmarvel.creditcardentry.library.CreditCardForm;

import org.unimodules.core.Promise;
import expo.modules.payments.stripe.R;
import expo.modules.payments.stripe.StripeModule;
import expo.modules.payments.stripe.util.CardFlipAnimator;
import expo.modules.payments.stripe.util.Converters;
import expo.modules.payments.stripe.util.Utils;

import com.stripe.android.SourceCallback;
import com.stripe.android.TokenCallback;
import com.stripe.android.model.Card;
import com.stripe.android.model.Source;
import com.stripe.android.model.SourceParams;
import com.stripe.android.model.Token;


/**
 * Created by dmitriy on 11/13/16
 */

public class AddCardDialogFragment extends DialogFragment {

  private static final String KEY = "KEY";
  public static final String ERROR_CODE = "errorCode";
  public static final String ERROR_DESCRIPTION = "errorDescription";

  private static final String CREATE_CARD_SOURCE_KEY = "CREATE_CARD_SOURCE_KEY";
  private static final String TAG = AddCardDialogFragment.class.getSimpleName();
  private static final String CCV_INPUT_CLASS_NAME = SecurityCodeText.class.getSimpleName();

  private String PUBLISHABLE_KEY;
  private String errorCode;
  private String errorDescription;
  private boolean CREATE_CARD_SOURCE;

  private ProgressBar progressBar;
  private CreditCardForm from;
  private ImageView imageFlipedCard;
  private ImageView imageFlipedCardBack;

  private volatile Promise promise;
  private boolean successful;
  private CardFlipAnimator cardFlipAnimator;
  private Button doneButton;
  private int tag = -1;

  public static AddCardDialogFragment newInstance(
      final String PUBLISHABLE_KEY,
      final String errorCode,
      final String errorDescription,
      final boolean CREATE_CARD_SOURCE,
      int tag
  ) {
    Bundle args = new Bundle();
    args.putString(KEY, PUBLISHABLE_KEY);
    args.putString(ERROR_CODE, errorCode);
    args.putString(ERROR_DESCRIPTION, errorDescription);
    args.putBoolean(CREATE_CARD_SOURCE_KEY, CREATE_CARD_SOURCE);

    args.putInt("tag", tag);
    AddCardDialogFragment fragment = new AddCardDialogFragment();
    fragment.setArguments(args);
    return fragment;
  }


  public void setPromise(Promise promise) {
    this.promise = promise;
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Bundle arguments = getArguments();
    if (arguments != null) {
      PUBLISHABLE_KEY = arguments.getString(KEY);
      errorCode = arguments.getString(ERROR_CODE);
      errorDescription = arguments.getString(ERROR_DESCRIPTION);
      CREATE_CARD_SOURCE = arguments.getBoolean(CREATE_CARD_SOURCE_KEY);
      this.tag = getArguments().getInt("tag", -1);
    }
  }

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    final View view = View.inflate(getActivity(), R.layout.payment_form_fragment_two, null);
    final AlertDialog dialog = new AlertDialog.Builder(getActivity())
      .setView(view)
      .setTitle(R.string.gettipsi_card_enter_dialog_title)
      .setPositiveButton(R.string.gettipsi_card_enter_dialog_positive_button, new DialogInterface.OnClickListener() {
        @Override
        public void onClick(DialogInterface dialogInterface, int i) {
          onSaveCLick();
        }
      })
      .setNegativeButton(R.string.gettipsi_card_enter_dialog_negative_button, null).create();
    dialog.show();

    doneButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
    doneButton.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View view) {
        onSaveCLick();
      }
    });
    doneButton.setTextColor(ContextCompat.getColor(getActivity(), R.color.colorAccent));
    dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(ContextCompat.getColor(getActivity(), R.color.colorAccent));
    doneButton.setEnabled(false);

    bindViews(view);
    init();

    return dialog;
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    if (!successful && promise != null) {
      promise.reject(errorCode, errorDescription);
      promise = null;
    }
    super.onDismiss(dialog);
  }

  private void bindViews(final View view) {
    progressBar = (ProgressBar) view.findViewById(R.id.buttonProgress);
    from = (CreditCardForm) view.findViewById(R.id.credit_card_form);
    imageFlipedCard = (ImageView) view.findViewById(R.id.imageFlippedCard);
    imageFlipedCardBack = (ImageView) view.findViewById(R.id.imageFlippedCardBack);
  }


  private void init() {
    from.setOnFocusChangeListener(new View.OnFocusChangeListener() {
      @Override
      public void onFocusChange(final View view, boolean b) {
        if (CCV_INPUT_CLASS_NAME.equals(view.getClass().getSimpleName())) {
          if (b) {
            cardFlipAnimator.showBack();
            if (view.getTag() == null) {
              view.setTag("TAG");
              ((SecurityCodeText) view).addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                  //unused
                }

                @Override
                public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                  doneButton.setEnabled(charSequence.length() == 3);
                }

                @Override
                public void afterTextChanged(Editable editable) {
                  //unused
                }
              });
            }
          } else {
            cardFlipAnimator.showFront();
          }
        }

      }
    });

    cardFlipAnimator = new CardFlipAnimator(getActivity(), imageFlipedCard, imageFlipedCardBack);
    successful = false;
  }

  public void onSaveCLick() {
    doneButton.setEnabled(false);
    progressBar.setVisibility(View.VISIBLE);
    final CreditCard fromCard = from.getCreditCard();
    final Card card = new Card(
      fromCard.getCardNumber(),
      fromCard.getExpMonth(),
      fromCard.getExpYear(),
      fromCard.getSecurityCode());

    String errorMessage = Utils.validateCard(card);
    if (errorMessage == null) {
      if (CREATE_CARD_SOURCE) {
        SourceParams cardSourceParams = SourceParams.createCardParams(card);
        StripeModule.getInstance(tag).getStripe().createSource(
          cardSourceParams,
          new SourceCallback() {
            @Override
            public void onSuccess(Source source) {
              // Normalize data with iOS SDK
              final Bundle sourceMap = Converters.convertSourceToWritableMap(source);
              sourceMap.putBundle("card", Converters.mapToWritableMap(source.getSourceTypeData()));
//                sourceMap.putNull("sourceTypeData"); // TODO: @sjchmiela

              if (promise != null) {
                promise.resolve(sourceMap);
                promise = null;
              }
              successful = true;
              dismiss();
            }

            @Override
            public void onError(Exception error) {
              doneButton.setEnabled(true);
              progressBar.setVisibility(View.GONE);
              showToast(error.getLocalizedMessage());
            }
          }
        );
      } else {
        StripeModule.getInstance(tag).getStripe().createToken(
            card,
            PUBLISHABLE_KEY,
            new TokenCallback() {
              public void onSuccess(Token token) {
                if (promise != null) {
                  promise.resolve(Converters.convertTokenToWritableMap(token));
                  promise = null;
                }
                successful = true;
                dismiss();
              }

              public void onError(Exception error) {
                doneButton.setEnabled(true);
                progressBar.setVisibility(View.GONE);
                showToast(error.getLocalizedMessage());
              }
            });
      }
    } else {
      doneButton.setEnabled(true);
      progressBar.setVisibility(View.GONE);
      showToast(errorMessage);
    }
  }

  public void showToast(String message) {
    Context context = getActivity();
    if (context != null && !TextUtils.isEmpty(message)) {
      Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }
  }
}
