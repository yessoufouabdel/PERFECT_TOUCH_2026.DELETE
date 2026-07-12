import axiosClient from "./axiosClient";

export const getOrderTypes = async () => {
  const response = await axiosClient.get("/orderTypes");
  return response.data;
};

export const saveOrder = async (payload) => {
  const response = await axiosClient.post("/orders", payload);
  return response.data;
};

export const getOrderReport = async ({ OrderDate, CompanyLocationID }) => {
  const response = await axiosClient.post("/orders/getOrderReport", {
    OrderDate,
    CompanyLocationID: String(CompanyLocationID),
  });

  return response.data;
};

export const insertShiftDetail = async (payload) => {
  const response = await axiosClient.post("/orders/insertShiftDetail", payload);

  return response.data;
};

export const selectShiftDetail = async ({
  OrderDate,
  CompanyLocationID,
  UserID,
}) => {
  const response = await axiosClient.post("/orders/selectShiftDetail", {
    OrderDate,
    CompanyLocationID: String(CompanyLocationID),
    UserID: Number(UserID),
  });

  return response.data;
};

export const selectOrdersToDelete = async ({
  OrderDate,
  UserID,
  CompanyLocationID,
}) => {
  const response = await axiosClient.post("/orders/selectOrderToDelete", {
    OrderDate,
    UserID: UserID === null || UserID === undefined ? null : Number(UserID),
    CompanyLocationID: String(CompanyLocationID || 1),
  });

  return response.data;
};

export const getOrderDetailsByOrderID = async (orderID) => {
  const response = await axiosClient.get(
    `/orders/orderDetailByOrderID/${orderID}`,
  );

  return response.data;
};

export const deleteOrdersByAdmin = async ({ deletedBy, orderIDs }) => {
  const response = await axiosClient.post("/orders/deleteOrderByAdmin", {
    deletedBy: String(deletedBy),
    orderIDs,
  });

  return response.data;
};

export const getDeletedOrdersByAdmin = async ({
  OrderDate,
  UserID = null,
  CompanyLocationID = 1,
}) => {
  const response = await axiosClient.post("/orders/selectDeletedOrderByAdmin", {
    OrderDate,
    UserID: UserID === null || UserID === undefined ? null : Number(UserID),
    CompanyLocationID: String(CompanyLocationID),
  });

  return response.data;
};

export const getDashboard = async ({
  ReportDate,
  CompanyLocationID,
  UserID = null,
}) => {
  const response = await axiosClient.post("/orders/selectDashboardFetch", {
    ReportDate,
    CompanyLocationID: String(CompanyLocationID || 1),
    UserID:
      UserID === null || UserID === undefined || UserID === ""
        ? null
        : Number(UserID),
  });

  return response.data;
};
