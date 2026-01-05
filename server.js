import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/youdosudoku', async (req, res) => {
    try {
        console.log('Proxying request to You Do Sudoku API...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('API Key present:', !!process.env.YOUDOSUDOKU_API_KEY);
        console.log('API Key (first 10 chars):', process.env.YOUDOSUDOKU_API_KEY?.substring(0, 10) + '...');

        const requestPayload = {
            url: 'https://www.youdosudoku.com/api/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.YOUDOSUDOKU_API_KEY || '',
            },
            body: req.body,
        };
        console.log(
            'Full request to YoudoSudoku:',
            JSON.stringify(
                {
                    url: requestPayload.url,
                    method: requestPayload.method,
                    headers: { ...requestPayload.headers, 'x-api-key': requestPayload.headers['x-api-key'].substring(0, 10) + '...' },
                    body: requestPayload.body,
                },
                null,
                2
            )
        );

        const response = await fetch(requestPayload.url, {
            method: requestPayload.method,
            headers: requestPayload.headers,
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
