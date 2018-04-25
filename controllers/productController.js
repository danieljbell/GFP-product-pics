const mongoose = require('mongoose');
const Product = mongoose.model('Product');

const cloudinary = require('cloudinary');
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

exports.homePage = (req, res) => {
    res.render('index', {
        bodyClass: 'list-all-products'
      }
    );
};

exports.newProduct = (req, res) => {
  res.render('editProduct', { 
    title: 'Add Product',
    bodyClass: 'edit-product'
  });
};

exports.createProduct = async (req, res) => {

    let filePaths = req.body.product_image;
    let multipleUpload = new Promise(async (resolve, reject) => {
      let upload_len = filePaths.length;
      let upload_res = new Array();

        for(let i = 0; i <= upload_len + 1; i++) {
            let filePath = filePaths[i];

            let prodName = req.body.code.split(' ').join('-') + '-' + i;

            await cloudinary.v2.uploader.upload(filePath, {
              tags: req.body.code,
              public_id: prodName
            }, (error, result) => {

                if(upload_res.length === upload_len) {
                    /* resolve promise after upload is complete */
                    resolve(upload_res)
                } else if(result) {
                      /*push public_ids in an array */  
                      upload_res.push(result.public_id);
                } else if(error) {
                      console.log(error)
                      reject(error)
                }

            })

        } 
    })
    .then((result) => result)
    .catch((error) => error)

    /*waits until promise is resolved before sending back response to user*/
    let upload = await multipleUpload; 

    let zipName = req.body.code.split(' ').join('-');

    const zip = await cloudinary.v2.uploader.create_zip({
      tags: req.body.code,
      target_public_id: zipName,
      target_tags: zipName,
      transformations: [
        { width: 400, height: 400, crop: 'fill' },
        { width: 400, height: 400, crop: 'fill', overlay: 'overlay' },
        { width: 1000, height: 1000, crop: 'pad' },
        { width: 1000, height: 1000, crop: 'pad', overlay: 'overlay' },
      ]
    }, function(error, result) {});
    
    const product = new Product({
        code: req.body.code,
        creator: req.user._id,
        product_image: upload,
        download_zip: zip.secure_url
    });

    await product.save();

    const emailData = {
      from: "GFP Product Pics <dbell@rfemail.com>",
      to: "djbell70@gmail.com",
      subject: "A New Product Has Been Added",
      html: `${product.code} has been added to the site. <a href="/product/${product.slug}">View Product</a> or <a href="${product.download_zip}">Download Pictures</a>`
    }

    // await mailgun.messages().send(emailData, function(error, body) {
    //   console.log(error);
    //   console.log(body);
    // });

    req.flash('success', `Successfully Added Product: ${product.code}!`);
    res.redirect(`/product/${product.slug}`);

};

exports.getProducts = async (req, res) => {
    const products = await Product.find();
    products.reverse();
    res.render('listProducts', {
        title: 'All Products',
        vueID: 'v-list-products',
        products
    });
};

exports.editProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });
    res.render('editProduct', { 
      title: `Edit ${product.code}`,
      bodyClass: 'edit-product',
      product
    }); 
}

exports.updateProduct = async (req, res) => {
    // const product = await Product.findOne({ _id: req.params.id });
    // res.render('editProduct', { title: `Edit ${product.code}`, product}); 
    const product = await Product.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();
    req.flash('success', `Successfully Updated ${product.code}`);
    res.redirect(`/product/${product._id}/edit`);
}

exports.getProductBySlug = async (req, res, next) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate('creator');
    if (!product) {
        return next(); 
    }
    
    res.render('singleProduct', { 
      title: product.code, 
      bodyClass: 'single-product',
      product
     });
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id });
  const images = product.product_image;
  const zip = `${product.code}.zip`;
  console.log();
  images.forEach(function(img) {
    cloudinary.uploader.destroy(img, function(error, result) {
      console.log(error);
    });
  });
  cloudinary.v2.uploader.destroy(`${product.code}.zip`, {
    resource_type: 'raw'
  }, function(error, result) {
    console.log(error);
  });
  await product.remove();
  req.flash('success', `${product.code} has been deleted`);
  res.redirect('/');
};

exports.deleteImage = async (req, res, next) => {
  cloudinary.uploader.destroy('zombie', function(result) { 
    console.log(result) 
  });
};

exports.searchProducts = async (req, res) => {
  const regex = new RegExp(escapeRegex(req.query.q), 'gi');
  const products = await Product.find({ "code": regex });
  res.render('searchProducts', {
    title: `Search For: ${req.query.q}`,
    query: req.query.q,
    products
  });
}

exports.findProducts = async (req, res) => {
  const regex = new RegExp(escapeRegex(req.query.q), 'gi');
  const products = await Product.find({ "code": regex });
  res.send(products);
}

exports.downloadImages = async (req, res) => {
  res.send(req.body);
}




function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

