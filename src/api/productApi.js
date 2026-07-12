import axiosClient from "./axiosClient";

export const getProductCategories = async () => {
  const response = await axiosClient.get("/productCategories");
  return response.data;
};

export const getProductsByCategory = async ({
  CompanyLocationID,
  ProductCategoryID,
  ProductName = "",
}) => {
  const response = await axiosClient.post(
    "/products/selectAvailableProductWithPriceForCashier",
    {
      CompanyLocationID: String(CompanyLocationID),
      ProductCategoryID,
      ProductName,
    }
  );

  return response.data;
};