import catchAsync from '../../utils/catchAsync';

const addProductListing = catchAsync(async (req, res) => {});

const getAllProductListings = catchAsync(async (req, res) => {});

const getSingleProductListing = catchAsync(async (req, res) => {});

const updateProductListing = catchAsync(async (req, res) => {});

const deleteProductListing = catchAsync(async (req, res) => {});

const productListingController = {
  addProductListing,
  getAllProductListings,
  getSingleProductListing,
  updateProductListing,
  deleteProductListing,
};

export default productListingController;
