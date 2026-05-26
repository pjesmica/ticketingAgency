import { apiSlice } from './apiSlice';

const SEATS_URL = '/api/seats';

export const seatsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSeatsForEvent: builder.query({
            query: (eventId) => ({ url: `${SEATS_URL}/${eventId}` }),
            keepUnusedDataFor: 30,
            providesTags: ['Seat'],
        }),
        generateSeats: builder.mutation({
            query: (eventId) => ({
                url: `${SEATS_URL}/generate/${eventId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Seat'],
        }),
    }),
});

export const { useGetSeatsForEventQuery, useGenerateSeatsMutation } = seatsApiSlice;