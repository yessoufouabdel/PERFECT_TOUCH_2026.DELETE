import axiosClient from "./axiosClient";

export const getCashiers = async () => {
  const response = await axiosClient.post("/userByRoles", {
    RoleID: 1,
    WithAdmin: 1,
    CompanyLocationID: 1,
  });

  return response.data;
};

export const getWaiters = async (CompanyLocationID = 1) => {
  const response = await axiosClient.post("/userByRoles", {
    RoleID: 3,
    WithAdmin: 0,
    CompanyLocationID: String(CompanyLocationID),
  });

  return response.data;
};

export const checkUserLogin = async (username, password) => {
  const response = await axiosClient.post("/users/checkUserLogin", {
    username,
    password,
  });

  return response.data;
};

export const changeUserPassword = async (payload) => {
  const response = await axiosClient.post("/users/changeUserPassword", payload);

  return response.data;
};
