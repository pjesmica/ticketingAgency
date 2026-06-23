import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { Provider } from "react-redux";
import store from "./store";

import "./assets/styles/bootstrap-custom.css";
import "./assets/styles/index.css";

import App from "./App";
import HomeScreen from "./screens/HomeScreen";
import EventScreen from "./screens/EventScreen";
import CartScreen from "./screens/CartScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MyOrdersScreen from "./screens/MyOrdersScreen";
import SeatMapScreen from "./screens/SeatMapScreen";
import PrivateRoute from "./components/privateRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboardScreen from "./screens/admin/AdminDashboardScreen";
import AdminEventsScreen from "./screens/admin/AdminEventsScreen";
import AdminEventEditScreen from "./screens/admin/AdminEventEditScreen";
import AdminUsersScreen from "./screens/admin/AdminUsersScreen";
import AdminUserEditScreen from "./screens/admin/AdminUserEditScreen";
import AdminOrdersScreen from "./screens/admin/AdminOrdersScreen";
import AdminVenueBuilderScreen from "./screens/admin/AdminVenueBuilderScreen";
import AdminVenueTemplatesScreen from "./screens/admin/AdminVenueTemplatesScreen";
import PlaceOrderScreen from "./screens/PlaceOrderScreen";
import OrderScreen from "./screens/OrderScreen";
import AdminOrderScreen from "./screens/admin/AdminOrderScreen";
import AdminEventBarcodesScreen from "./screens/admin/AdminEventBarcodesScreen";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import reportWebVitals from "./reportWebVitals";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* HOME */}
      <Route index element={<HomeScreen />} />

      {/* EVENT DETAILS */}
      <Route path="/events/:id" element={<EventScreen />} />

      {/* AUTH */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* PROTECTED ROUTES */}
      <Route path="" element={<PrivateRoute />}>
        <Route path="/events/:id/seats" element={<SeatMapScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/placeorder" element={<PlaceOrderScreen />} />
        <Route path="/orders/:id" element={<OrderScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/myorders" element={<MyOrdersScreen />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route path="" element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboardScreen />} />
        <Route path="/admin/events" element={<AdminEventsScreen />} />
        <Route path="/admin/events/new" element={<AdminEventEditScreen />} />
        <Route
          path="/admin/events/:id/edit"
          element={<AdminEventEditScreen />}
        />
        <Route
          path="/admin/events/:id/barcodes"
          element={<AdminEventBarcodesScreen />}
        />
        <Route path="/admin/users" element={<AdminUsersScreen />} />
        <Route path="/admin/users/:id/edit" element={<AdminUserEditScreen />} />
        <Route path="/admin/orders" element={<AdminOrdersScreen />} />
        <Route path="/admin/orders" element={<AdminOrdersScreen />} />
        <Route path="/admin/orders/:id" element={<AdminOrderScreen />} />
        <Route path="/admin/venue/:id" element={<AdminVenueBuilderScreen />} />
        <Route path="/admin/venue" element={<AdminVenueBuilderScreen />} />
        <Route
          path="/admin/venue-templates"
          element={<AdminVenueTemplatesScreen />}
        />
      </Route>
    </Route>,
  ),
);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PayPalScriptProvider
        options={{ "client-id": "sb", currency: "EUR" }}
        deferLoading={true}
      >
        <RouterProvider router={router} />
      </PayPalScriptProvider>
    </Provider>
  </React.StrictMode>,
);

reportWebVitals();