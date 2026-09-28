import mongoose from 'mongoose';
const schema = new mongoose.Schema({ teamCode:{type:String,required:true,unique:true}, teamName:{type:String,required:true}, pathId:{type:String,default:''}, members:[String], coins:{type:Number,default:0}, currentStage:{type:Number,default:1}, completedStages:{type:[Number],default:[]}, startTime:{type:Date,default:null}, status:{type:String,enum:['waiting','active','completed'],default:'waiting'} }, {timestamps:true});
if (mongoose.models.Team && !mongoose.models.Team.schema?.paths?.pathId) {
  delete mongoose.models.Team;
}
export default mongoose.models.Team || mongoose.model('Team', schema);