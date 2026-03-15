import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { isTurnstileDisabled, getTurnstileSiteKey } from '../utils/turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

/**
 * Renders Cloudflare Turnstile when not disabled (e.g. on localhost).
 * Use isTurnstileDisabled() to know if the widget is shown and if token is required.
 */
export default function TurnstileWidget({ onSuccess, onError, onExpire }: TurnstileWidgetProps) {
  if (isTurnstileDisabled()) return null;
  return (
    <div className="flex justify-center min-h-[65px] items-center">
      <Turnstile
        siteKey={getTurnstileSiteKey()}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'dark',
          size: 'normal',
        }}
      />
    </div>
  );
}
