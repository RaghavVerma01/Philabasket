import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import newsletterRouter from './routes/newsletterRoute.js'
import blogRouter from './routes/blogRouter.js';

import mailRouter from './routes/mailRoute.js';
import categoryRouter from './routes/categoryRoute.js'
import exportRouter from './routes/exportRouter.js'
import feedbackRouter from './routes/feedbackRoute.js'
import couponRouter from './routes/couponRouter.js'
import bannerRouter from './routes/bannerRouter.js'
import headerRouter from './routes/headerRouter.js'
import adminRouter from './routes/adminRouter.js'
import mediaRouter from './routes/mediaRouter.js'

// App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(express.json({ limit: '20mb' })); 
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors({
    origin: ['https://philabasket-frontend.vercel.app', 'http://localhost:5173','http://localhost:5174','https://philabasket-admin.vercel.app','https://new.philabasket.in'],
    credentials: true
}))

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/newsletter', newsletterRouter);
// Inside server.js


// ... other middlewares
app.use('/api/blog', blogRouter);


// ... other imports and app initialization

app.use('/api/mail', mailRouter);
app.use('/api/category', categoryRouter);

app.use('/api/export', exportRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/banner',bannerRouter)
app.use('/api/header', headerRouter);
app.use('/api/admin',adminRouter)
app.use('/api/media', mediaRouter);


app.get('/',(req,res)=>{
    res.send("API Working")
})

export default app;

app.listen(port, ()=> console.log('Server started on PORT : '+ port))