// server local express 
import express from 'express';
import router from './routes/api.js'; 

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));
app.use('/api', router); 

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);       
});
