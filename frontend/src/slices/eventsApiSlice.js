import { EVENTS_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const eventsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getEvents: builder.query({
            query: ({ keyword = '', category = '' } = {}) => ({
                url: EVENTS_URL,
                params: { keyword, category },
            }),
            providesTags: ['Event'],
            keepUnusedDataFor: 5,
        }),
        getAllEventsAdmin: builder.query({
            query: () => ({ url: `${EVENTS_URL}/admin/all` }),
            providesTags: ['Event'],
            keepUnusedDataFor: 5,
        }),
        getEventDetails: builder.query({
            query: (eventId) => ({ url: `${EVENTS_URL}/${eventId}` }),
            keepUnusedDataFor: 5,
        }),
        createEvent: builder.mutation({
            query: (data) => ({
                url: EVENTS_URL,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Event'],
        }),
        updateEvent: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${EVENTS_URL}/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Event'],
        }),
        deleteEvent: builder.mutation({
            query: (id) => ({
                url: `${EVENTS_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Event'],
        }),
    }),
});

export const {
    useGetEventsQuery,
    useGetAllEventsAdminQuery,
    useGetEventDetailsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
} = eventsApiSlice;