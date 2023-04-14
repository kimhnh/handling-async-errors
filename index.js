const express = require('express');
const app = express();
const path = require('path');
const AppError = require('./AppError.js');
const mongoose = require('mongoose');
const Product = require('./models/product');
const methodOverride = require('method-override');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/farmStand2');
  console.log('mongo connection open');
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

//middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true})); //gets info for req.body
app.use(methodOverride('_method'));

const categories = ['fruit', 'vegetable', 'dairy'];

//show all items
app.get('/products', async (req, res, next) => {
  try {
    const { category } = req.query;
    if (category){
      const products = await Product.find({ category })
      res.render('products/index', { products, category })
    }else {
      const products = await Product.find({})
      res.render('products/index', { products, category: 'All' })
    }
  } catch(e) {
    next(e)
  }
})

//create a new item
app.get('/products/new', (req, res) => {
  // throw new AppError('Not allowed', 401);
  res.render('products/new', { categories });
})

app.post('/products', async (req, res, next) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`);
  } catch (e){
    next(e);
  }

})

//show a specific item
app.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if(!product){
      throw new AppError('Product not found', 404);
    }
    // console.log(product);
    res.render('products/show', { product });
  } catch(e) {
    next(e)
  }

})

//edit an item (my app crashes when I purposely edit an item without a price. refer to 6:15 on video)
app.get('/products/:id/edit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }
    res.render('products/edit', { product, categories })
  } catch(e) {
    next(e)
  }
})

app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
  res.redirect(`/products/${product._id}`);
})

app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await Product.findByIdAndDelete(id);
  res.redirect('/products');
})

app.use((err, req, res, next) => {
  const {status = 500, message = 'Something went wrong' } = err;
  res.status(status).send(message);
})

app.listen(3000, () => {
    console.log('app is listening on port 3000')
})
