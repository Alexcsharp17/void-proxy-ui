import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  isOpen: boolean;
}

const initialState: SearchState = {
  isOpen: false,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    toggleSearch: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { setSearchOpen, toggleSearch } = searchSlice.actions;
export default searchSlice.reducer;
