import { apiSlice } from './apiSlice';

const URL = '/api/venue-sections';

export const venueSectionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenueSections: builder.query({
            query: (eventId) => ({ url: `${URL}/${eventId}` }),
            providesTags: ['VenueSection'],
            keepUnusedDataFor: 5,
        }),
        saveVenueSections: builder.mutation({
            query: ({ eventId, sections, decorations }) => ({
                url: `${URL}/${eventId}`,
                method: 'POST',
                body: { sections, decorations },
            }),
            invalidatesTags: ['VenueSection', 'Seat'],
        }),
    }),
});

export const {
    useGetVenueSectionsQuery,
    useSaveVenueSectionsMutation,
} = venueSectionApiSlice;