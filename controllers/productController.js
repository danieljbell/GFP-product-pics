const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const axios = require('axios');
const cheerio = require('cheerio');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

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

    // let zipName = req.body.code.split(' ').join('-');

    // const zip = await cloudinary.v2.uploader.create_zip({
    //   tags: req.body.code,
    //   target_public_id: zipName,
    //   target_tags: zipName,
    //   transformations: [
    //     { width: 400, height: 400, crop: 'fill' },
    //     { width: 400, height: 400, crop: 'fill', overlay: 'overlay' },
    //     { width: 1000, height: 1000, crop: 'pad' },
    //     { width: 1000, height: 1000, crop: 'pad', overlay: 'overlay' },
    //   ]
    // }, function(error, result) {});

    const url = `https://jdparts.deere.com/servlet/com.deere.u90.jdparts.view.servlets.searchcontroller.EquipmentWhereUsedSearch?userAction=search&partNumberInfo=${req.body.code}`;
    await axios.get(url)
      .then(function (response) {
        const $ = cheerio.load(response.data);
        const form = $('form[action="/servlet/com.deere.u90.jdparts.view.servlets.searchcontroller.EquipmentWhereUsedSearch"]');
        const tableRows = form.find('table:nth-child(8) table');
        let fitment = [];
        tableRows.find('tr td:nth-child(8)').each(function(i, elem) {
          fitment[i] = $(this).text().trim();
        });
        fitment.splice(0, 1);
        var uniqueFitment = [...new Set(fitment)];
        if (uniqueFitment.length < 1) {
          uniqueFitment = 'Fitment Not Available';
        }
        return uniqueFitment;
      })
      .catch(function (error) {
        console.log(error);
        const uniqueFitment = 'Failed Scrape';
      })
      .then(function(uniqueFitment) {
        const product = new Product({
          code: req.body.code,
          creator: req.user._id,
          product_image: upload,
          // download_zip: zip.secure_url,
          fitment: uniqueFitment
        });

        console.log(uniqueFitment);

        product.save();

        req.flash('success', `Successfully Added Product: ${product.code}!`);
        res.redirect(`/product/${product.code}`);
      })
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

    if (product.fitment.length < 1) {
      console.log('no fitment. trying to fetch data.\n');
      const url = `https://jdparts.deere.com/servlet/com.deere.u90.jdparts.view.servlets.searchcontroller.EquipmentWhereUsedSearch?userAction=search&partNumberInfo=${req.params.slug}`;
      axios.get(url)
        .then(function (response) {
          const $ = cheerio.load(response.data);
          const form = $('form[action="/servlet/com.deere.u90.jdparts.view.servlets.searchcontroller.EquipmentWhereUsedSearch"]');
          const tableRows = form.find('table:nth-child(8) table');
          let fitment = [];
          tableRows.find('tr td:nth-child(8)').each(function(i, elem) {
            fitment[i] = $(this).text().trim();
          });
          fitment.splice(0, 1);
          console.log(fitment);
          product.update({ fitment: fitment });
        })  
        .catch(function (error) {
          console.log(error);
          res.send('Refresh your page, something went wrong. If it continues, tell Daniel!');
        });
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

exports.updateSellerChannel = async (req, res) => {
  const product = await Product.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true
    }).exec();
  req.flash('success', `${product.code} has been updated and listed on ${product.seller_channels}.`);
  res.redirect('back');
}

exports.findGFPProduct = async (req, res) => {
  axios.get('https://www.greenfarmparts.com/-p/jdzg900.htm')
    .then(function(response) {
      console.log(response);
    })
    .catch(function(err) {
      console.log(err);
    })
  res.render('searchProducts', {
    title: `Search For: ${req.query.q}`,
    query: req.query.q,
    products
  });
}


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

