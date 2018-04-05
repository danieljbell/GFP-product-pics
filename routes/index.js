const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { catchErrors } = require('../handlers/errorHandlers.js');

// HOMEPAGE
router.get('/', catchErrors(productController.getProducts));

// ADDING NEW PRODUCTS
router.get('/add', productController.newProduct);
router.post('/add', catchErrors(productController.createProduct));

// EDITING, UPDATING AND DELETING SINGLE PRODUCTS
router.get('/product/:id/edit', catchErrors(productController.editProduct));
router.post('/add/:id', catchErrors(productController.updateProduct));
router.get('/product/:id/delete', catchErrors(productController.deleteProduct));

// VIEWING SINGLE PRODUCT
router.get('/product/:slug', catchErrors(productController.getProductBySlug));

// router.get('/search', productController.searchProducts);


router.get('/search', catchErrors(productController.searchProducts));





/*
=========================
API
=========================
*/
router.get('/api/v1/search', catchErrors(productController.findProducts));


module.exports = router;