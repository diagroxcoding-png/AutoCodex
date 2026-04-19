const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// 🔐 REGISTER
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const { error } = await supabase
        .from("users")
        .insert([{ username, password: hash, premium: false }]);

    if (error) return res.send(error.message);

    res.send("OK");
});

// 🔐 LOGIN
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (!data) return res.send("Nema korisnika");

    const match = await bcrypt.compare(password, data.password);

    if (!match) return res.send("Pogrešna šifra");

    const token = jwt.sign(
        { id: data.id, username: data.username },
        process.env.JWT_SECRET
    );

    res.json({ token });
});

// 🔑 MIDDLEWARE
function auth(req, res, next) {
    const token = req.headers.authorization;

    if (!token) return res.sendStatus(401);

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.sendStatus(401);
    }
}

// 🚗 OBD KODOVI
app.get("/codes", auth, async (req, res) => {
    const { data } = await supabase.from("codes").select("*");
    res.json(data);
});

// 💳 PREMIUM
app.post("/premium", auth, async (req, res) => {
    await supabase
        .from("users")
        .update({ premium: true })
        .eq("id", req.user.id);

    res.send("OK");
});

// 🔥 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server radi na " + PORT));
