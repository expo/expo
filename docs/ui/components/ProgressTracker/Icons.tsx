import { CheckIcon, InfoCircleIcon } from '@expo/styleguide-icons';

export function SuccessCheckmarkIcon() {
  return (
    <div className="flex items-center justify-center rounded-full border-8 border-success bg-success size-20">
      <CheckIcon className="text-success size-10" />
    </div>
  );
}

export function InfoIcon() {
  return <InfoCircleIcon className="text-icon-secondary size-20" />;
}
