const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: { message: 'Duplicate entry. This record already exists.' }
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: { message: 'Invalid reference. Related record does not exist.' }
    });
  }
  
  if (err.code === '23502') { // Not null violation
    return res.status(400).json({
      error: { message: 'Missing required field.' }
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

