import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import { Provider } from 'react-redux';
import store from './store';

import './assets/styles/bootstrap-custom.css';
import './assets/styles/index.css';

import App from './App';
import HomeScreen from './screens/HomeScreen';
import EventScreen from './screens/EventScreen';
import CartScreen from './screens/CartScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import SeatMapScreen from './screens/SeatMapScreen';
import PrivateRoute from './components/privateRoute';

import reportWebVitals from './reportWebVitals';

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
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/myorders" element={<MyOrdersScreen />} />
      </Route>

    </Route>
  )
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();