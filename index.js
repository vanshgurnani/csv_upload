const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/testme', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.memoryStorage(); // Using memory storage for file upload
const upload = multer({ storage: storage });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const UserModel = mongoose.model('UserModel', userSchema);

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});
app.get('/get', (req, res) => {
    const indexPath = path.join(__dirname, 'get.html');
    res.sendFile(indexPath);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Process the uploaded Excel file
    const fileBuffer = req.file.buffer;

    // Parse the Excel file using 'xlsx'
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    // Check if there are sheets in the workbook
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return res.status(400).send('No sheets found in the Excel file.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert Excel data to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Map the Excel data to match the MongoDB schema
    const mappedData = jsonData.map(item => ({
      username: item.username,
      password: item.password,
    }));

    // Insert data into MongoDB using UserModel.create()
    await UserModel.insertMany(mappedData);

    res.status(200).send('File uploaded and data inserted into MongoDB');
  } catch (error) {
    console.error('Error processing and uploading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/data', async (req, res) => {
    try {
      const users = await UserModel.find({});
      res.json(users);
    } catch (error) {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).send('Internal Server Error');
    }
});
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
