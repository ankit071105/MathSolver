const express = require('express');
const multer = require('multer');
const tesseract = require('tesseract.js');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const WOLFRAM_ALPHA_APP_ID = 'XE9JEA-45WT6J2ELU';

app.use(express.static(path.join(__dirname, '../public')));

app.post('/solve', upload.single('mathImage'), async (req, res) => {
    try {
        let mathExpression;
        if (req.body.mathText) {
            mathExpression = req.body.mathText;
        } else if (req.file) { 
            const imagePath = req.file.path;
            const { data: { text } } = await tesseract.recognize(imagePath, 'eng');
            console.log('OCR Text:', text);
            mathExpression = text.replace(/[^0-9+\-*/().^%]/g, '').replace(/\s+/g, '');
            console.log('Cleaned Text:', mathExpression);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete file:', err);
                } else {
                    console.log('Uploaded file deleted successfully');
                }
            });
        } else {
            return res.status(400).json({ error: 'No math problem provided.' });
        }
        if (!mathExpression || !/[0-9]/.test(mathExpression)) {
            return res.json({ solution: 'Invalid math expression detected.' });
        }

        const wolframUrl = `http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(mathExpression)}&format=plaintext&output=JSON&appid=${WOLFRAM_ALPHA_APP_ID}`;

        const response = await axios.get(wolframUrl);
        const pods = response.data.queryresult.pods;

        if (pods && pods.length > 0) {
            const solutionPod = pods.find(pod => pod.title === "Result" || pod.title === "Solutions");
            const solution = solutionPod ? solutionPod.subpods[0].plaintext : "Solution not found";
            console.log('Solution:', solution);

            res.json({ solution: `The solution is: ${solution}` });
        } else {
            res.json({ solution: 'No solution found by Wolfram Alpha.' });
        }
    } catch (error) {
        console.error('Error processing the request:', error.message);
        res.status(500).json({ error: 'Failed to solve the problem' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
