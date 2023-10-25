import { Button } from '@expo/styleguide';
import { FormEvent } from 'react';

export function FeedbackForm() {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/postFeedback', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Success!', data);
  }

  return (
    <form onSubmit={onSubmit}>
      <textarea name="feedback" />
      <Button type="submit" />
    </form>
  );
}
