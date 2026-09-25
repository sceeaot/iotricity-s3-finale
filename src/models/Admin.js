import mongoose from 'mongoose';
const schema = new mongoose.Schema({ username:{type:String,required:true,unique:true}, password:{type:String,required:true}, role:{type:String,enum:['admin','volunteer'],default:'admin'} });
export default mongoose.models.Admin || mongoose.model('Admin', schema);