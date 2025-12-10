import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/youdosudoku', async (req, res) => {
    try {
        console.log('Proxying request to You Do Sudoku API...');
        console.log('Request body:', req.body);

        const response = await fetch('https://www.youdosudoku.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        console.log('You Do Sudoku API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully fetched puzzle');

        res.json(data);
    } catch (error) {
        console.error('Sudoku API proxy error:', error);
        res.status(500).json({
            error: 'Failed to fetch sudoku puzzle',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
