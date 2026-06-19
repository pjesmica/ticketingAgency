import { apiSlice } from './apiSlice';

const TEMPLATE_URL = '/api/venue-templates';

export const venueTemplateApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenueTemplates: builder.query({
            query: () => ({ url: TEMPLATE_URL }),
            providesTags: ['VenueTemplate'],
            keepUnusedDataFor: 5,
        }),
        getVenueTemplateById: builder.query({
            query: (id) => ({ url: `${TEMPLATE_URL}/${id}` }),
            providesTags: ['VenueTemplate'],
            keepUnusedDataFor: 5,
        }),
        createVenueTemplate: builder.mutation({
            query: (data) => ({
                url: TEMPLATE_URL,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['VenueTemplate'],
        }),
        updateVenueTemplate: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${TEMPLATE_URL}/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['VenueTemplate'],
        }),
        deleteVenueTemplate: builder.mutation({
            query: (id) => ({
                url: `${TEMPLATE_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['VenueTemplate'],
        }),
        applyVenueTemplate: builder.mutation({
            query: ({ eventId, ...data }) => ({
                url: `${TEMPLATE_URL}/apply/${eventId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['VenueLayout', 'Event', 'Seat'],
        }),
    }),
});

export const {
    useGetVenueTemplatesQuery,
    useGetVenueTemplateByIdQuery,
    useCreateVenueTemplateMutation,
    useUpdateVenueTemplateMutation,
    useDeleteVenueTemplateMutation,
    useApplyVenueTemplateMutation,
} = venueTemplateApiSlice;