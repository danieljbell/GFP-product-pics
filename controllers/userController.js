const mongoose = require('mongoose');
const multer = require('multer');
const User = mongoose.model('User');
const Product = mongoose.model('Product');

const Datauri = require('datauri')

const cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const promisify = require('es6-promisify');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }
  const datauri = new Datauri();
  datauri.format('.png', req.file.buffer);
  await cloudinary.v2.uploader.upload(datauri.content, {
    public_id: `${req.body.first_name}-${req.body.last_name}`,
    tags: `${req.body.first_name}-${req.body.last_name}`
  }, function(error, result) {
    req.body.profile_photo = result.public_id
  });
  next();
};

exports.newUser = (req, res) => {
  res.render('editProfile', {
      bodyClass: 'edit-user',
      title: 'Add User'
    }
  );
};

exports.editUser = (req, res) => {
  res.render('editProfile', {
      bodyClass: 'edit-user',
      title: 'Edit Profile'
    }
  );
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('first_name');
  req.checkBody('first_name', 'Please enter your first name').notEmpty();
  req.sanitizeBody('last_name');
  req.checkBody('last_name', 'Please enter your last name').notEmpty();
  req.checkBody('email', 'Please enter an email address').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Please enter your password').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Your passwords are not matching!').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('editProfile', {
      title: 'Add User',
      body: req.body,
      bodyClass: 'edit-user',
      flashes: req.flash()
    });
    return;
  }

  next();
};

exports.register = async (req, res, next) => {  
  const user = new User({ 
    email: req.body.email, 
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone_number: req.body.phone_number,
    profile_photo: req.body.profile_photo
  });
  // const register = promisify(User.register, User);
  User.register(user, req.body.password, function(err, user) {
    console.log(err);
  })
  res.render('/')
};

exports.getUser = async (req, res) => {
  const products = await Product.find({ creator: req.user._id });
    if (!products) {
        return next(); 
    }

  res.render('profile/displayProfile', {
    title: 'user profile',
    products
  }
  );
}