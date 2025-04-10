import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      mobile: {
        type: Number,
        required: true,
      },
      role: {
        type: String,
        enum: ["user", "traveller"],
        default: "user"
      },
      userType:{
        type:String,
        default:'user'
      },
      socialLinks: {
        whatsapp: { type: String, default: "" }, // Store as a string (Number may start with + or leading zeros)
        instagram: { type: String, default: "" }, // Username only
        twitter: { type: String, default: "" }, // Full URL
        linkedin: { type: String, default: "" }, // Full URL
        facebook: { type: String, default: "" }, // Full URL
      },
      location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: {
          city: { type: String, default: "" },
          state: { type: String, default: "" },
          country: { type: String, default: "" },
        },
      },
},{
    timestamps:true,
});

const User = mongoose.model("User",userSchema);

export default User;