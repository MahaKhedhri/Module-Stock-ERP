const Supplier = require('../models/Supplier');

const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers.map(formatSupplier));
  } catch (error) {
    next(error);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: { message: 'Supplier not found' } });
    }
    res.json(formatSupplier(supplier));
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(formatSupplier(supplier));
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.update(req.params.id, req.body);
    if (!supplier) {
      return res.status(404).json({ error: { message: 'Supplier not found' } });
    }
    res.json(formatSupplier(supplier));
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.delete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: { message: 'Supplier not found' } });
    }
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('associated products')) {
      return res.status(422).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatSupplier = (supplier) => ({
  id: supplier.id.toString(),
  name: supplier.name,
  email: supplier.email,
  phone: supplier.phone,
  address: supplier.address
});

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};

