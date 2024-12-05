import { Button, mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

import { Callout } from '~/ui/components/Callout';
import { Input, Textarea } from '~/ui/components/Form';
import { CALLOUT, LABEL, RawH2 } from '~/ui/components/Text';

const isDev = process.env.NODE_ENV === 'development';
const URL = isDev
  ? `http://api.expo.test/v2/feedback/docs-send`
  : `https://api.expo.dev/v2/feedback/docs-send`;

type Props = {
  pathname?: string;
};

export const FeedbackDialog = ({ pathname }: Props) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setSuccess] = useState(false);
  const [errors, setErrors] = useState<object[] | null>(null);

  function sendFeedback() {
    fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback,
        email: email.length ? email : undefined,
        url: pathname,
      }),
    })
      .then(res => res.json())
      .then(res => {
        console.log(res);
        if (res.errors) {
          setErrors(res.errors);
        } else {
          setErrors(null);
          setFeedback('');
          setEmail('');
          setSuccess(true);
        }
      })
      .catch(setErrors);
  }

  return (
    <>
      <Dialog.Portal>
        <Dialog.Overlay
          className={mergeClasses(
            'dialog-overlay absolute z-[999]',
            'data-[state=open]:animate-fadeIn',
            'data-[state=closed]:animate-fadeOut'
          )}>
          <div className="fixed inset-0 bg-[#00000080]" />
        </Dialog.Overlay>
        <div className="fixed left-0 top-0 z-[1000] flex h-dvh w-dvw items-center justify-center">
          <Dialog.Content
            className={mergeClasses(
              'dialog-content',
              'break-words backface-hidden left-0 top-0 max-h-[90vh] w-[90vw] max-w-[500px] overflow-hidden rounded-lg border border-default bg-default shadow-md outline-0',
              'data-[state=open]:animate-slideUpAndFadeIn',
              'data-[state=closed]:animate-fadeOut'
            )}>
            {isSuccess ? (
              <>
                <div className="flex flex-col items-center px-6 py-12">
                  <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-success bg-success">
                    <CheckIcon className="icon-2xl text-icon-success" />
                  </div>
                  <RawH2 className="!mb-2 !mt-5">Feedback received</RawH2>
                  <CALLOUT theme="secondary">
                    Your feedback will help us make our docs better. Thanks for sharing!
                  </CALLOUT>
                </div>
                <div className="flex min-h-[56px] items-center justify-end gap-2 bg-subtle px-3">
                  <Dialog.Close asChild>
                    <Button type="submit">Done</Button>
                  </Dialog.Close>
                </div>
              </>
            ) : (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  sendFeedback();
                }}>
                <div className="px-6 py-5">
                  <div className="flex justify-between">
                    <RawH2 className="!my-0">Share your feedback</RawH2>
                    <Dialog.Close asChild>
                      <Button theme="quaternary" leftSlot={<XIcon className="icon-md" />} />
                    </Dialog.Close>
                  </div>
                  <CALLOUT theme="secondary">
                    Add your feedback to help us improve this doc.
                  </CALLOUT>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <LABEL>Feedback</LABEL>
                      <Textarea
                        autoFocus
                        className="h-[180px] resize-none"
                        characterLimit={1000}
                        value={feedback}
                        onChange={event => {
                          setFeedback(event.target.value);
                        }}
                      />
                    </div>
                    <div>
                      <LABEL>Email (optional)</LABEL>
                      <CALLOUT theme="secondary">
                        We might reach out to you about your feedback.
                      </CALLOUT>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={event => {
                          setEmail(event.target.value);
                          if (event.target.value.length === 0) {
                            setErrors(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {errors?.length && (
                    <Callout type="error">
                      <CALLOUT>
                        {errors.map(error => ('message' in error ? error.message : '')).join('\n')}
                      </CALLOUT>
                    </Callout>
                  )}
                </div>
                <div className="flex min-h-[56px] items-center justify-end gap-2 bg-subtle px-3">
                  <Dialog.Close asChild>
                    <Button theme="quaternary">No Thanks</Button>
                  </Dialog.Close>
                  <Button type="submit">Submit</Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </>
  );
};
