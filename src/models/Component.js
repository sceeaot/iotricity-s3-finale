import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name:{type:String,required:true}, cyberpunkName:{type:String,required:true}, price:{type:Number,required:true}, stock:{type:Number,default:12}, description:{type:String,default:''} });
export default mongoose.models.Component || mongoose.model('Component', schema);