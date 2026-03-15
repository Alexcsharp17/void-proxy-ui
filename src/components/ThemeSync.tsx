import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setSystemTheme } from '../store/slices/appSlice';

function getStoredTheme(): 'light' | 'dark' | null {
  const v = localStorage.getItem('void-ui-theme');
  return v === 'light' || v === 'dark' ? v : null;
}

/**
 * Синхронизирует тему из store с document. При смене темы в системе обновляет приложение
 * только если пользователь не сохранял ручной выбор (ручной выбор хранится в localStorage).
 */
export default function ThemeSync() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.app.theme);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getStoredTheme() !== null) return;
      dispatch(setSystemTheme(m.matches ? 'dark' : 'light'));
    };
    m.addEventListener('change', handleChange);
    return () => m.removeEventListener('change', handleChange);
  }, [dispatch]);

  return null;
}
