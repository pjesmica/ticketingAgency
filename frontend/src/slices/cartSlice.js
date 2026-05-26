import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    cartItems: localStorage.getItem('cartItems')
        ? JSON.parse(localStorage.getItem('cartItems'))
        : [],
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const item = action.payload;
            // Unique key: eventId + ticketTypeId
            const existItem = state.cartItems.find(
                (x) => x.eventId === item.eventId && x.ticketTypeId === item.ticketTypeId
            );
            if (existItem) {
                state.cartItems = state.cartItems.map((x) =>
                    x.eventId === item.eventId && x.ticketTypeId === item.ticketTypeId
                        ? { ...x, quantity: x.quantity + item.quantity }
                        : x
                );
            } else {
                state.cartItems = [...state.cartItems, item];
            }
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        removeFromCart: (state, action) => {
            const { eventId, ticketTypeId } = action.payload;
            state.cartItems = state.cartItems.filter(
                (x) => !(x.eventId === eventId && x.ticketTypeId === ticketTypeId)
            );
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        updateCartQty: (state, action) => {
            const { eventId, ticketTypeId, quantity } = action.payload;
            state.cartItems = state.cartItems.map((x) =>
                x.eventId === eventId && x.ticketTypeId === ticketTypeId
                    ? { ...x, quantity }
                    : x
            );
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        clearCart: (state) => {
            state.cartItems = [];
            localStorage.removeItem('cartItems');
        },
    },
});

export const { addToCart, removeFromCart, updateCartQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;