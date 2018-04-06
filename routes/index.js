const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers.js');

// HOMEPAGE
router.get('/', 
    authController.checkAuth,
    catchErrors(productController.getProducts)
);

// ADDING NEW PRODUCTS
router.get('/add', 
    authController.checkAuth,
    productController.newProduct
);
router.post('/add', 
    catchErrors(productController.createProduct)
);

// EDITING, UPDATING AND DELETING SINGLE PRODUCTS
router.get('/product/:id/edit', 
    catchErrors(productController.editProduct)
);
router.post('/add/:id', 
    catchErrors(productController.updateProduct)
);
router.get('/product/:id/delete', 
    catchErrors(productController.deleteProduct)
);

// VIEWING SINGLE PRODUCT
router.get('/product/:slug', 
    catchErrors(productController.getProductBySlug)
);


router.get('/search', 
    catchErrors(productController.searchProducts)
);


// USERS
// router.get('/user/new', userController.newUser);
// router.post('/user/new', 
//     userController.validateRegister,
//     userController.register
// );

router.get('/login', authController.loginScreen);
router.post('/login', authController.login);
router.get('/logout', authController.logout);



/*
=========================
API
=========================
*/
router.get('/api/v1/search', catchErrors(productController.findProducts));


module.exports = router;