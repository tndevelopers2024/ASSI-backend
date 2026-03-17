import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/user.js";

dotenv.config();

const usersData = [
    {
        fullname: "Dr. Tharun Jayaprakash",
        email: "tharun.kolathur1996@gmail.com",
        phonenumber: "9897916045",
        designation_hospital: "Apollo Hospitals Chennai",
    },
    {
        fullname: "Dr. Manikannan Chinnadurai",
        email: "manikannan1994.mk@gmail.com",
        phonenumber: "7708536901",
        designation_hospital: "Ganga Hospital Coimbatore",
    },
    {
        fullname: "Dr. Sabari Nath M",
        email: "sabarimbbs79@gmail.com",
        phonenumber: "7736789069",
        designation_hospital: "Hinduja Hospital Mumbai",
    },
    {
        fullname: "Dr. Ponnuru Nagaraju",
        email: "ponnurunagaraju39@gmail.com",
        phonenumber: "9491448657",
        designation_hospital: "Indian Spinal Injuries centre Delhi",
    },
    {
        fullname: "Dr. Vishwa Mohan Priyadarshi",
        email: "drvishwamochan@gmail.com",
        phonenumber: "8375045086",
        designation_hospital: "Kothari Medical Center Kolkata",
    },
    {
        fullname: "Dr. Trivedi Ravi Pradhyumna",
        email: "Revitrivedi75@gmail.com",
        phonenumber: "7978516551",
        designation_hospital: "Leelavati Hospital Mumbai",
    },
    {
        fullname: "Dr. D. Vijayakumar",
        email: "drvijayvarma96@gmail.com",
        phonenumber: "8072388581",
        designation_hospital: "MIOT International Hospital Chennai",
    },
    {
        fullname: "Dr. Chintamani Jiva Keluskar",
        email: "kchintamani2@gmail.com",
        phonenumber: "8433515601",
        designation_hospital: "Nanavati Hospital Mumbai",
    },
    {
        fullname: "Dr. Jaspal Khushalsingh Pardeshi",
        email: "jaspalpardeshi2206@gmail.com",
        phonenumber: "9405693367",
        designation_hospital: "Sancheti Spine Centre & Hospital Pune",
    },
    {
        fullname: "Dr. Sanjay Meena",
        email: "drsanjayroop@gmail.com",
        phonenumber: "8890550091",
        designation_hospital: "Sri Balaji Hospital New Delhi",
    },
    {
        fullname: "Dr. Yogenkumar Amrutlal Adodariya",
        email: "yogenadodariya4596@gmail.com",
        phonenumber: "8140042691",
        designation_hospital: "Stavya Hospital Ahmedabad",
    },
    {
        fullname: "Dr. Anurag Sharma",
        email: "anuragsh666@gmail.com",
        phonenumber: "7974934109",
        designation_hospital: "Sir Ganga Ram Hospital New Delhi",
    },
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        for (let i = 0; i < usersData.length; i++) {
            const data = usersData[i];
            const user_id = `ASSI-LM-${(i + 1).toString().padStart(3, '0')}`;

            const existingUser = await User.findOne({ email: data.email });
            if (existingUser) {
                console.log(`User with email ${data.email} already exists. Skipping.`);
                continue;
            }

            await User.create({
                ...data,
                user_id: user_id,
                password: "123456",
                role: "user",
                membership_plan: "Life Member",
                membership_category: "Life Member",
                pay_status: "Paid",
                payment_mode: "Offline/Seeded",
                address: data.designation_hospital,
                amount: 0,
                token: "",
                profile_url: "",
                nmc_registration_number: "",
                lastpaid_date: new Date().toISOString().split('T')[0],
            });
            console.log(`Created user: ${data.fullname} (${user_id})`);
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding users:", err);
        process.exit(1);
    }
};

seedUsers();
