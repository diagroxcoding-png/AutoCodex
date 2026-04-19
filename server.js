const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true
}));

const db = new sqlite3.Database("./db/database.db");

// USERS
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    premium INTEGER DEFAULT 0
)`);

// CODES
db.run(`CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    description TEXT
)`);

// UBACI KODOVE AKO JE PRAZNO
db.get("SELECT COUNT(*) as count FROM codes", (err, row) => {
    if (row.count === 0) {
        db.run(`INSERT INTO codes (code, description) VALUES
        ('P0001','Regulator količine goriva - kvar'),
        ('P0010','Aktuator bregaste osovine - kvar'),
        ('P0100','MAF senzor - kvar'),
        ('P0171','Smjesa siromašna'),
        ('P0172','Smjesa bogata'),
        ('P0300','Nasumično preskakanje paljenja'),
        ('P0301','Cilindar 1 misfire'),
        ('P0302','Cilindar 2 misfire'),
        ('P0420','Katalizator loša efikasnost'),
        ('P0500','Senzor brzine - kvar')
        `);
    }
});

// REGISTER
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hash], () => res.send("OK"));
});

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username=?", [username], async (err, user) => {
        if (!user) return res.send("Nema korisnika");

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = user;
            res.send("OK");
        } else res.send("Pogrešna šifra");
    });
});

// GET CODES (premium logic)
app.get("/codes", (req, res) => {
    if (!req.session.user) return res.sendStatus(401);

    db.get("SELECT premium FROM users WHERE id=?", [req.session.user.id], (err, user) => {
        if (!user.premium) {
            db.all("SELECT * FROM codes LIMIT 3", (e, rows) => res.json(rows));
        } else {
            db.all("SELECT * FROM codes", (e, rows) => res.json(rows));
        }
    });
});

// AKTIVIRAJ PREMIUM (RUČNO)
app.post("/activatePremium", (req, res) => {
    const { username } = req.body;
    db.run("UPDATE users SET premium=1 WHERE username=?", [username], () => res.send("OK"));
});

app.listen(3000, () => console.log("Server radi na http://localhost:3000"));