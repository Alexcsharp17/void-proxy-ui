import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getReferralFromUrlSearch, saveReferralToCookie } from '../utils/referralCookie';

/**
 * When the user opens the site with ?ref=CODE (landing, login, any page),
 * save the ref to a cookie so that later on /register we can prefill the referral code
 * even if they navigate without ref in the URL (same behavior as old UI).
 */
export default function ReferralRefSync() {
  const location = useLocation();

  useEffect(() => {
    const ref = getReferralFromUrlSearch(location.search);
    if (ref) saveReferralToCookie(ref);
  }, [location.search]);

  return null;
}
