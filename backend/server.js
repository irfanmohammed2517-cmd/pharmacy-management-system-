const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

const medicineSchema = new mongoose.Schema({
  name:{type:String,required:true}, brand:{type:String,required:true}, category:{type:String,required:true}, description:String,
  price:{type:Number,required:true}, discount:{type:Number,default:0}, stock:{type:Number,required:true}, batchNumber:{type:String,required:true},
  manufacturingDate:Date, expiryDate:Date, prescriptionRequired:{type:Boolean,default:false}, image:String
},{timestamps:true});
const Medicine = mongoose.model('Medicine', medicineSchema);
const userSchema = new mongoose.Schema({
  name:{type:String,required:true}, email:{type:String,required:true,unique:true,lowercase:true,trim:true}, password:{type:String,required:true},
  phone:String,address:String,role:{type:String,enum:['user','admin'],default:'user'}
},{timestamps:true});
const User = mongoose.model('User', userSchema);
const cartSchema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},items:[{medicineId:{type:mongoose.Schema.Types.ObjectId,ref:'Medicine'},name:String,price:Number,quantity:{type:Number,default:1}}]},{timestamps:true});
const Cart = mongoose.model('Cart', cartSchema);
const orderSchema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},medicines:[{medicineId:{type:mongoose.Schema.Types.ObjectId,ref:'Medicine',required:true},name:String,quantity:{type:Number,required:true},price:{type:Number,required:true}}],totalAmount:{type:Number,required:true},address:{type:String,required:true},paymentMethod:{type:String,default:'Cash on Delivery'},status:{type:String,enum:['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'],default:'Pending'},orderDate:{type:Date,default:Date.now}},{timestamps:true});
const Order = mongoose.model('Order', orderSchema);

app.get('/',(req,res)=>res.json({message:'Pharmacy Management API running'}));
app.post('/register',async(req,res)=>{try{const{name,email,password}=req.body;if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});if(await User.findOne({email}))return res.status(400).json({message:'Email already registered'});const hash=await bcrypt.hash(password,10);const user=await User.create({name,email,password:hash,role:'user'});res.status(201).json({message:'Registration successful',user:{id:user._id,name:user.name,email:user.email,role:user.role}})}catch(e){res.status(500).json({message:e.message})}});
app.post('/login',async(req,res)=>{try{const{email,password}=req.body;const user=await User.findOne({email});if(!user)return res.status(401).json({message:'Invalid email or password'});if(!(await bcrypt.compare(password,user.password)))return res.status(401).json({message:'Invalid email or password'});res.json({message:'Login successful',user:{id:user._id,name:user.name,email:user.email,phone:user.phone,address:user.address,role:user.role}})}catch(e){res.status(500).json({message:e.message})}});
app.post('/logout',(req,res)=>res.json({message:'Logout successful'}));
app.get('/users/:id',async(req,res)=>{try{const u=await User.findById(req.params.id).select('-password');if(!u)return res.status(404).json({message:'User not found'});res.json(u)}catch(e){res.status(500).json({message:e.message})}});
app.put('/users/:id',async(req,res)=>{try{const u=await User.findByIdAndUpdate(req.params.id,{$set:{name:req.body.name,phone:req.body.phone,address:req.body.address}},{new:true}).select('-password');res.json(u)}catch(e){res.status(500).json({message:e.message})}});

app.post('/medicines',async(req,res)=>{try{res.status(201).json(await Medicine.create(req.body))}catch(e){res.status(400).json({message:e.message})}});
app.get('/medicines',async(req,res)=>{try{res.json(await Medicine.find().sort({createdAt:-1}))}catch(e){res.status(500).json({message:e.message})}});
app.get('/medicines/stock/low',async(req,res)=>{try{res.json(await Medicine.find({stock:{$lte:10}}))}catch(e){res.status(500).json({message:e.message})}});
app.get('/medicines/stock/expired',async(req,res)=>{try{res.json(await Medicine.find({expiryDate:{$lt:new Date()}}))}catch(e){res.status(500).json({message:e.message})}});
app.get('/medicines/:id',async(req,res)=>{try{const m=await Medicine.findById(req.params.id);if(!m)return res.status(404).json({message:'Medicine not found'});res.json(m)}catch(e){res.status(500).json({message:e.message})}});
app.put('/medicines/:id',async(req,res)=>{try{res.json(await Medicine.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}))}catch(e){res.status(400).json({message:e.message})}});
app.delete('/medicines/:id',async(req,res)=>{try{await Medicine.findByIdAndDelete(req.params.id);res.json({message:'Medicine deleted'})}catch(e){res.status(500).json({message:e.message})}});

app.post('/cart/add',async(req,res)=>{try{const{userId,medicineId,quantity=1}=req.body;const m=await Medicine.findById(medicineId);if(!m)return res.status(404).json({message:'Medicine not found'});if(m.stock<quantity)return res.status(400).json({message:'Insufficient stock'});let c=await Cart.findOne({userId});if(!c)c=await Cart.create({userId,items:[]});const item=c.items.find(i=>i.medicineId.toString()===medicineId);if(item)item.quantity+=Number(quantity);else c.items.push({medicineId,name:m.name,price:m.price,quantity:Number(quantity)});await c.save();res.json(c)}catch(e){res.status(500).json({message:e.message})}});
app.get('/cart/:userId',async(req,res)=>{try{res.json(await Cart.findOne({userId:req.params.userId})||{userId:req.params.userId,items:[]})}catch(e){res.status(500).json({message:e.message})}});
app.put('/cart/update',async(req,res)=>{try{const{userId,medicineId,quantity}=req.body;const c=await Cart.findOne({userId});if(!c)return res.status(404).json({message:'Cart not found'});const i=c.items.find(x=>x.medicineId.toString()===medicineId);if(!i)return res.status(404).json({message:'Item not found'});if(quantity<=0)c.items=c.items.filter(x=>x.medicineId.toString()!==medicineId);else i.quantity=Number(quantity);await c.save();res.json(c)}catch(e){res.status(500).json({message:e.message})}});
app.delete('/cart/:userId/:medicineId',async(req,res)=>{try{const c=await Cart.findOne({userId:req.params.userId});if(c){c.items=c.items.filter(i=>i.medicineId.toString()!==req.params.medicineId);await c.save()}res.json(c||{items:[]})}catch(e){res.status(500).json({message:e.message})}});

app.post('/orders',async(req,res)=>{try{const{userId,address,paymentMethod='Cash on Delivery'}=req.body;const c=await Cart.findOne({userId});if(!c||!c.items.length)return res.status(400).json({message:'Cart is empty'});let total=0;const meds=[];for(const item of c.items){const m=await Medicine.findById(item.medicineId);if(!m)return res.status(400).json({message:`Medicine ${item.name} not found`});if(m.stock<item.quantity)return res.status(400).json({message:`Insufficient stock for ${m.name}`});total+=m.price*item.quantity;meds.push({medicineId:m._id,name:m.name,quantity:item.quantity,price:m.price});}const order=await Order.create({userId,medicines:meds,totalAmount:total,address,paymentMethod});for(const x of meds)await Medicine.findByIdAndUpdate(x.medicineId,{$inc:{stock:-x.quantity}});c.items=[];await c.save();res.status(201).json(order)}catch(e){res.status(500).json({message:e.message})}});
app.get('/orders/user/:userId',async(req,res)=>{try{res.json(await Order.find({userId:req.params.userId}).sort({createdAt:-1}))}catch(e){res.status(500).json({message:e.message})}});
app.get('/orders/:id',async(req,res)=>{try{res.json(await Order.findById(req.params.id).populate('userId','name email phone'))}catch(e){res.status(500).json({message:e.message})}});
app.put('/orders/:id/status',async(req,res)=>{try{res.json(await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}))}catch(e){res.status(400).json({message:e.message})}});

app.get('/admin/users',async(req,res)=>res.json(await User.find().select('-password').sort({createdAt:-1})));
app.delete('/admin/users/:id',async(req,res)=>{try{const u=await User.findById(req.params.id);if(!u)return res.status(404).json({message:'User not found'});if(u.role==='admin')return res.status(400).json({message:'Admin cannot be deleted'});await User.findByIdAndDelete(req.params.id);await Cart.deleteOne({userId:req.params.id});res.json({message:'User deleted'})}catch(e){res.status(500).json({message:e.message})}});
app.get('/admin/orders',async(req,res)=>res.json(await Order.find().populate('userId','name email phone').sort({createdAt:-1})));
app.get('/admin/dashboard',async(req,res)=>{try{const[totalUsers,totalMedicines,totalOrders,pendingOrders,lowStockMedicines,expiredMedicines]=await Promise.all([User.countDocuments({role:'user'}),Medicine.countDocuments(),Order.countDocuments(),Order.countDocuments({status:'Pending'}),Medicine.countDocuments({stock:{$lte:10}}),Medicine.countDocuments({expiryDate:{$lt:new Date()}})]);const sales=await Order.aggregate([{$match:{status:{$ne:'Cancelled'}}},{$group:{_id:null,total:{$sum:'$totalAmount'}}}]);res.json({totalUsers,totalMedicines,totalOrders,pendingOrders,lowStockMedicines,expiredMedicines,totalSales:sales[0]?.total||0})}catch(e){res.status(500).json({message:e.message})}});

app.listen(process.env.PORT||5000,()=>console.log(`Server running on port ${process.env.PORT||5000}`));
