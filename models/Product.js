const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const productSchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        required: 'Please enter a product code'
    },
    slug: String,
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You have to be logged in'
    },
    product_image: [String],
    download_zip: String
});

productSchema.pre('save', async function(next) {
    // create slug
    if (!this.isModified('code')) {
        next();
        return;
    }
    this.slug = slug(this.code);

    this.code = this.code.toLowerCase();

    const slugRegEx = new RegExp(`^(${this.slug})`, 'i');
    const productsWithSlug = await this.constructor.find({ slug: slugRegEx });

    if (productsWithSlug.length) {
        next(new Error('Product Already Exists'));
        return;
    }

    next();
});

productSchema.methods.uploadImages = function (product_image, callback) {
var product = this.toObject();
if (product_image.length) {
    product_image.forEach(function (image) {
        cloudinary.uploader.upload(image.path).then(function (result) {
            product.product_image.push(result.secure_url);
        });
    });
} else {
    cloudinary.uploader.upload(product_image.path).then(function (result) {
        product.product_image.push(result.secure_url);
        // not sure what to return when image has been uploaded
    });
    }
}


productSchema.index({
    code: 'text'
});

module.exports = mongoose.model('Product', productSchema);