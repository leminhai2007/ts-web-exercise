import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Proxying request to You Do Sudoku API...');
        console.log('Request body:', req.body);

        // Forward the request to You Do Sudoku API
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
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Successfully fetched puzzle');

        // Return the data
        return res.status(200).json(data);
    } catch (error) {
        console.error('Sudoku API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch sudoku puzzle',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
