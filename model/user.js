import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    token: String,
    user_id: String,
    password: String,
    fullname: String,
    email: String,
    phonenumber: String,
    payment_mode: String,
    membership_plan: String,
    amount: Number,
    membership_category: String,
    pay_status: String,
    lastpaid_date: String,
    address: String,
    profile_url: String,
    designation_hospital: String,
    nmc_registration_number: String,

    // ⭐ NEW FIELD
    role: {
      type: String,
      enum: ["user", "superadmin"],
      default: "user",
    },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
