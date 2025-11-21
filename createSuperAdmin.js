import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/user.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await User.create({
      token: "",
      user_id: "superadmin001",
      password: "assipass@001", // plain text (your login logic supports both)
      fullname: "Super Admin",
      email: "superadmin@assi.com",
      phonenumber: "",
      payment_mode: "",
      membership_plan: "",
      amount: 0,
      membership_category: "",
      pay_status: "",
      lastpaid_date: "",
      address: "",
      profile_url: "",
      designation_hospital: "",
      nmc_registration_number: "",
      role: "superadmin",
    });

    console.log("Super Admin Created:", admin);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
