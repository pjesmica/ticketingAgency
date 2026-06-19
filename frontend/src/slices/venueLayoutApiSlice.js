import { apiSlice } from './apiSlice';

const VENUE_URL = '/api/venue-layout';

export const venueLayoutApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenueLayout: builder.query({
            query: (eventId) => ({ url: `${VENUE_URL}/${eventId}` }),
            providesTags: ['VenueLayout'],
            keepUnusedDataFor: 5,
        }),
        saveVenueLayout: builder.mutation({
            query: ({ eventId, ...data }) => ({
                url: `${VENUE_URL}/${eventId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['VenueLayout'],
        }),
    }),
});

export const { useGetVenueLayoutQuery, useSaveVenueLayoutMutation } = venueLayoutApiSlice;