const filterDeletedProducts = (req, res, next) => {
    const isAdminRoute = req.originalUrl.includes('/admin');
    
    if (!isAdminRoute) {
      req.query = {
        ...req.query,
        includeDeleted: false 
      };
    }
    
    next();
  };
  
  module.exports = filterDeletedProducts;
