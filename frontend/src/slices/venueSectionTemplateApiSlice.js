import { apiSlice } from './apiSlice';

const URL = '/api/venue-section-templates';

export const venueSectionTemplateApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenueSectionTemplates: builder.query({
            query: () => ({ url: URL }),
            providesTags: ['VenueSectionTemplate'],
            keepUnusedDataFor: 60,
        }),
        getVenueSectionTemplateById: builder.query({
            query: (id) => ({ url: `${URL}/${id}` }),
            providesTags: ['VenueSectionTemplate'],
            keepUnusedDataFor: 60,
        }),
        createVenueSectionTemplate: builder.mutation({
            query: (data) => ({ url: URL, method: 'POST', body: data }),
            invalidatesTags: ['VenueSectionTemplate'],
        }),
        updateVenueSectionTemplate: builder.mutation({
            query: ({ id, ...data }) => ({ url: `${URL}/${id}`, method: 'PUT', body: data }),
            invalidatesTags: ['VenueSectionTemplate'],
        }),
        deleteVenueSectionTemplate: builder.mutation({
            query: (id) => ({ url: `${URL}/${id}`, method: 'DELETE' }),
            invalidatesTags: ['VenueSectionTemplate'],
        }),
        applyVenueSectionTemplate: builder.mutation({
            query: ({ eventId, ...data }) => ({
                url: `${URL}/apply/${eventId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['VenueSection', 'Seat', 'Event'],
        }),
    }),
});

export const {
    useGetVenueSectionTemplatesQuery,
    useGetVenueSectionTemplateByIdQuery,
    useCreateVenueSectionTemplateMutation,
    useUpdateVenueSectionTemplateMutation,
    useDeleteVenueSectionTemplateMutation,
    useApplyVenueSectionTemplateMutation,
} = venueSectionTemplateApiSlice;