const express = require("express");
const path = require("path");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SUPABASE
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// 📁 STATIC FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// 🏠 HOME (fix Cannot GET /)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚗 GET OBD CODES
app.get("/codes", async (req, res) => {
    const { data, error } = await supabase
        .from("codes")
        .select("*");

    if (error) return res.status(500).send(error.message);

    res.json(data);
});

// 🧪 TEST ROUTE
app.get("/test", (req, res) => {
    res.json({ status: "AutoCodex radi ✔" });
});

// 🔥 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server radi na " + PORT));
