import Axios from 'axios';

import { config } from 'dotenv';
config();
const axios = Axios.create({
  params: {
    api_key: process.env.RIOT,
  },
});

export default axios;
