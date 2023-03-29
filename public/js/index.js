/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logOut } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe.js';

// DOM ELEMENTS
const mapBoxEl = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBoxEl) {
  const locations = JSON.parse(mapBoxEl.dataset.locations);
  displayMap(locations);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    document.getElementById('email').value;
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';
    const oldPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;

    await updateSettings(
      { oldPassword, newPassword, newPasswordConfirm },
      'password'
    );
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logOut);

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    document.getElementById('book-tour').textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
