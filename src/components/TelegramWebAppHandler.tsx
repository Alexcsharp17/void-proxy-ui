import React from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

/**
 * When the app is opened from Telegram Web App (Mini App), runs auto login/register
 * using Telegram initData. Renders nothing.
 */
export default function TelegramWebAppHandler() {
  useTelegramWebApp();
  return null;
}
