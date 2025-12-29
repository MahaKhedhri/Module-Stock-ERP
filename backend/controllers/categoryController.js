const Category = require('../models/Category');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.json(categories.map(formatCategory));
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }
    res.json(formatCategory(category));
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(formatCategory(category));
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }
    res.json(formatCategory(category));
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.delete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('associated products')) {
      return res.status(422).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatCategory = (category) => ({
  id: category.id.toString(),
  name: category.name,
  description: category.description
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

