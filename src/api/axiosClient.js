import axios from "axios";

const axiosClient = axios.create({
 // baseURL: "/api", //WHEN GOING LIVE, U USE THIS
  baseURL: import.meta.env.VITE_API_URL || "/api", //WHEN TESTING, U USE THIS
  withCredentials: false,
});

export default axiosClient;