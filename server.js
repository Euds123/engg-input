require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is required (Neon PostgreSQL connection string).');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
    max: 10,
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error', err);
});

pool.query('SELECT 1')
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => {
        console.error('Database connection failed', err);
        process.exit(1);
    });

const COMPONENT_COLUMNS = [
    'DrawingId', 'LineId', 'RevNo', 'SpoolNo', 'Item', 'ItemCode', 'Description',
    'Size_Inch', 'MFA', 'SMIV', 'HMIV', 'SubContractor', 'IsMIVLinesIssuance',
    'ComponentStatus', 'InsuType', 'InsuThickness', 'InsuLength', 'RussianDescription',
    'Specification', 'Length_InchMeter', 'ComponentWeight', 'ComponentSurfaceArea',
    'PaintSystem', 'UniqueComponentIdentifier', 'ErectionDrawingNo',
    'Quantity', 'Length', 'Part_No', 'Description_Language', 'SheetNo',
];

const quotedCols = COMPONENT_COLUMNS.map((c) => `"${c}"`).join(', ');

function normalizeBoolean(value) {
    if (value === true || value === 1 || value === '1' || value === 'true' || value === 'Y' || value === 'y') {
        return true;
    }
    if (value === false || value === 0 || value === '0' || value === 'false' || value === 'N' || value === 'n') {
        return false;
    }
    return null;
}

function rowValues(data, { jdeQuantity } = {}) {
    return COMPONENT_COLUMNS.map((col) => {
        let value =
            col === 'Quantity' && jdeQuantity
                ? (data.DPLQty !== undefined ? data.DPLQty : data.Quantity)
                : data[col];
        if (value === '' || value === undefined) {
            value = null;
        }
        if (col === 'IsMIVLinesIssuance') {
            return normalizeBoolean(value);
        }
        if (col === 'Quantity') {
            return value !== null ? parseFloat(value) : null;
        }
        return value;
    });
}

async function insertComponent(client, data, options = {}) {
    const values = rowValues(data, options);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sqlText = `INSERT INTO "ComponentDetails" (${quotedCols}) VALUES (${placeholders})`;
    await client.query(sqlText, values);
}

// Get all components
app.get('/api/components', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "ComponentDetails" ORDER BY "CreatedAt" DESC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add new component
app.post('/api/components', async (req, res) => {
    try {
        const data = req.body;
        await insertComponent(pool, data);
        res.status(201).send({ message: 'Component added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Bulk add components
app.post('/api/components/bulk', async (req, res) => {
    const dataArray = req.body;
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        for (const data of dataArray) {
            await insertComponent(client, data);
        }
        await client.query('COMMIT');
        res.status(201).send({ message: `${dataArray.length} components added successfully` });
    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Rollback failed', rollbackErr);
            }
        }
        res.status(400).send('Database Error: ' + err.message);
    } finally {
        if (client) {
            client.release();
        }
    }
});

// Delete component
app.delete('/api/components/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            res.status(400).send('Invalid id');
            return;
        }
        await pool.query('DELETE FROM "ComponentDetails" WHERE "Id" = $1', [id]);
        res.send({ message: 'Component deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// JDE Integration
app.post('/api/jde/components', async (req, res) => {
    try {
        const data = req.body;
        await insertComponent(pool, data, { jdeQuantity: true });
        res.status(201).send({ message: 'Component integrated from JDE successfully' });
    } catch (err) {
        res.status(500).send('Integration Error: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
