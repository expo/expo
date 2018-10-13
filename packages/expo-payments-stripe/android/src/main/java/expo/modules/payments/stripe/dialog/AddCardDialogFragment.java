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

import expo.core.Promise;
import expo.modules.payments.stripe.R;
import expo.modules.payments.stripe.StripeModule;
import expo.modules.payments.stripe.util.CardFlipAnimator;
import expo.modules.payments.stripe.util.Utils;
import com.stripe.android.TokenCallback;
import com.stripe.android.model.Card;
import com.stripe.android.model.Token;


/**
 * Created by dmitriy on 11/13/16
 */

public class AddCardDialogFragment extends DialogFragment {

  private static final String KEY = "KEY";
  private static final String TAG = AddCardDialogFragment.class.getSimpleName();
  private static final String CCV_INPUT_CLASS_NAME = SecurityCodeText.class.getSimpleName();
  private String PUBLISHABLE_KEY;

  private ProgressBar progressBar;
  private CreditCardForm from;
  private ImageView imageFlipedCard;
  private ImageView imageFlipedCardBack;

  private volatile Promise promise;
  private boolean successful;
  private CardFlipAnimator cardFlipAnimator;
  private Button doneButton;
  private int tag = -1;

  public static AddCardDialogFragment newInstance(final String PUBLISHABLE_KEY, int tag) {
    Bundle args = new Bundle();
    args.putString(KEY, PUBLISHABLE_KEY);
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
    if (getArguments() != null) {
      PUBLISHABLE_KEY = getArguments().getString(KEY);
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
      promise.reject(TAG, getString(R.string.gettipsi_user_cancel_dialog));
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
      StripeModule.getInstance(tag).getStripe().createToken(
        card,
        PUBLISHABLE_KEY,
        new TokenCallback() {
          public void onSuccess(Token token) {
            final Bundle newToken = new Bundle();
            newToken.putString("tokenId", token.getId());
            newToken.putBoolean("livemode", token.getLivemode());
            newToken.putDouble("created", token.getCreated().getTime());
            newToken.putBoolean("user", token.getUsed());
            final Bundle cardMap = new Bundle();
            final Card card = token.getCard();
            cardMap.putString("cardId", card.getId());
            cardMap.putString("brand", card.getBrand());
            cardMap.putString("last4", card.getLast4());
            cardMap.putInt("expMonth", card.getExpMonth());
            cardMap.putInt("expYear", card.getExpYear());
            cardMap.putString("country", card.getCountry());
            cardMap.putString("currency", card.getCurrency());
            cardMap.putString("name", card.getName());
            cardMap.putString("addressLine1", card.getAddressLine1());
            cardMap.putString("addressLine2", card.getAddressLine2());
            cardMap.putString("addressCity", card.getAddressCity());
            cardMap.putString("addressState", card.getAddressState());
            cardMap.putString("addressCountry", card.getAddressCountry());
            cardMap.putString("addressZip", card.getAddressZip());
            newToken.putBundle("card", cardMap);
            if (promise != null) {
              promise.resolve(newToken);
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
