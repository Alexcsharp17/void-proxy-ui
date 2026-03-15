import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import dashboardReducer from './slices/dashboardSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    dashboard: dashboardReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
