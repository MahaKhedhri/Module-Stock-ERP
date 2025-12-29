const Product = require('../models/Product');

const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.json(products.map(formatProduct));
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    res.json(formatProduct(product));
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(formatProduct(product));
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    res.json(formatProduct(product));
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.delete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { quantity, note } = req.body;
    const product = await Product.adjustStock(req.params.id, quantity, note);
    res.json(formatProduct(product));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatProduct = (product) => ({
  id: product.id.toString(),
  name: product.name,
  sku: product.sku,
  categoryId: product.category_id.toString(),
  purchasePrice: parseFloat(product.purchase_price),
  salePrice: parseFloat(product.sale_price),
  quantity: parseInt(product.quantity),
  unit: product.unit,
  image: product.image,
  supplierId: product.supplier_id.toString(),
  minStock: parseInt(product.min_stock)
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};

