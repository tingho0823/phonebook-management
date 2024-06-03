const express = require("express");
const app = express();
const path = require('path');
const collection = require("./mongodb");
const createCollection = require("./mongodb1");
const templatePath = path.join(__dirname, '../templates');
const multer = require('multer');
const xlsx = require('xlsx');
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use(express.static(path.join(__dirname, 'templates')));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});


const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return cb(new Error('Only .xlsx files are allowed'));
        }
        cb(null, true);
    }
});

app.get("/upload", (req, res) => {
    res.render("upload");
});

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/home", (req, res) => {
    res.render("home");
});

// Sign up
app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.name,
        password: req.body.password
    };
    await collection.insertMany([data]);

    res.render("create");
});

// Login
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.name });
        if (check.password == req.body.password) {
            res.render("create");
        } else {
            res.send("wrong password");
        }
    } catch {
        res.send("user not exist");
    }
});

// Create
app.post("/create", async (req, res) => {
    const data1 = {
        name: req.body.name,
        email: req.body.email,
        number: req.body.number
    };
    await createCollection.insertMany([data1]);

    res.render("create");
});

// Display
app.get('/data', async (req, res) => {
    const data = await createCollection.find({}, { _id: 0, name: 1, number: 1, email: 1 });
    res.json(data);
});

// Delete
app.delete('/delete/:number', async (req, res) => {
    const { number } = req.params;
    try {
        const result = await createCollection.deleteOne({ number });
        if (result.deletedCount === 1) {
            res.send('Entry deleted successfully');
        } else {
            res.status(404).send('Entry not found');
        }
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).send('Failed to delete entry');
    }
});

// Update
app.put('/update', async (req, res) => {
    const { originalNumber, name, email, number } = req.body;
    const result = await createCollection.updateOne(
        { number: originalNumber },
        { $set: { name, email, number } }
    );
    if (result.modifiedCount > 0) {
        res.send("Update successful");
    } else {
        res.send("Entry not found");
    }
});

//upload
app.post('/upload', upload.single('excelFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const filePath = 'uploads/' + req.file.filename;

    try {
        // Read the uploaded XLSX file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        // Map JSON data to required format
        const arrayToInsert = jsonData.map(row => ({
            name: row["name"],
            email: row["email"],
            number: row["number"],
        }));

        // Validate data
        const validData = arrayToInsert.filter(item => item.name && item.email);

        if (validData.length === 0) {
            return res.status(400).send('No valid data to insert');
        }

        // Insert into MongoDB
        await createCollection.insertMany(validData);
        console.log("File imported successfully.");
        res.render("create");
    } catch (error) {
        console.error('Error importing file:', error);
        res.status(500).send('Failed to import data');
    }
});




app.listen(3000, () => {
    console.log("port connected");
});
