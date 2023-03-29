/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MnK0NFG7cH10PF5NWe2ulpfoiZVkkCPXkpB4vknfpG1q4qTiWJ7z18GZTJ2fGlXbb1ylPuGeqxBntOf02GJJj2N00e8bpd0Pe'
);
export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const res = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });
    console.log('RESULT', res);
    console.log(res.data.session.id);
    // 2) Create checkout from right way to do as line 17
    await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
  } catch (e) {
    showAlert('error', e);
  }
};
