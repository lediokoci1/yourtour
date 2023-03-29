/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${
        type === 'password' ? 'updatepassword' : 'updateme'
      }`,
      data,
    });
    showAlert(
      'success',
      `${type === 'password' ? 'Password' : 'Data'} Updated Successfully!`
    );

    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
