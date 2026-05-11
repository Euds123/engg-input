require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // For Azure/Cloud
        trustServerCertificate: true // For local dev
    }
};

// Database Connection Pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });

// Get all components
app.get('/api/components', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM ComponentDetails ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add new component
app.post('/api/components', async (req, res) => {
    try {
        const data = req.body;
        const pool = await poolPromise;
        const request = pool.request();

        const columns = [
            'DrawingId', 'LineId', 'RevNo', 'SpoolNo', 'Item', 'ItemCode', 'Description', 
            'Size_Inch', 'MFA', 'SMIV', 'HMIV', 'SubContractor', 'IsMIVLinesIssuance', 
            'ComponentStatus', 'InsuType', 'InsuThickness', 'InsuLength', 'RussianDescription', 
            'Specification', 'Length_InchMeter', 'ComponentWeight', 'ComponentSurfaceArea', 
            'PaintSystem', 'UniqueComponentIdentifier', 'ErectionDrawingNo', 
            'Quantity', 'Length', 'Part_No', 'Description_Language', 'SheetNo'
        ];

        columns.forEach(col => {
            if (col === 'Quantity') {
                request.input(col, sql.Decimal(18, 4), data[col] !== "" && data[col] !== undefined ? parseFloat(data[col]) : null);
            } else {
                request.input(col, data[col] || null);
            }
        });

        const query = `INSERT INTO ComponentDetails (${columns.join(', ')}) 
                       VALUES (${columns.map(col => '@' + col).join(', ')})`;
        
        await request.query(query);
        res.status(201).send({ message: 'Component added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Bulk add components
app.post('/api/components/bulk', async (req, res) => {
    try {
        const dataArray = req.body;
        const pool = await poolPromise;
        
        const columns = [
            'DrawingId', 'LineId', 'RevNo', 'SpoolNo', 'Item', 'ItemCode', 'Description', 
            'Size_Inch', 'MFA', 'SMIV', 'HMIV', 'SubContractor', 'IsMIVLinesIssuance', 
            'ComponentStatus', 'InsuType', 'InsuThickness', 'InsuLength', 'RussianDescription', 
            'Specification', 'Length_InchMeter', 'ComponentWeight', 'ComponentSurfaceArea', 
            'PaintSystem', 'UniqueComponentIdentifier', 'ErectionDrawingNo', 
            'Quantity', 'Length', 'Part_No', 'Description_Language', 'SheetNo'
        ];

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const data of dataArray) {
                const request = new sql.Request(transaction);
                columns.forEach(col => {
                    let value = data[col];
                    if (value === "" || value === undefined) value = null;
                    
                    if (col === 'Quantity') {
                        request.input(col, sql.Decimal(18, 4), value !== null ? parseFloat(value) : null);
                    } else {
                        request.input(col, value);
                    }
                });

                const query = `INSERT INTO ComponentDetails (${columns.join(', ')}) 
                               VALUES (${columns.map(col => '@' + col).join(', ')})`;
                await request.query(query);
            }
            await transaction.commit();
            res.status(201).send({ message: `${dataArray.length} components added successfully` });
        } catch (err) {
            if (transaction._isOpened) await transaction.rollback();
            res.status(400).send("Database Error: " + err.message);
        }
    } catch (err) {
        res.status(500).send("Server Error: " + err.message);
    }
});

// Delete component
app.delete('/api/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM ComponentDetails WHERE Id = @Id');
        res.send({ message: 'Component deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// JDE Integration
app.post('/api/jde/components', async (req, res) => {
    try {
        const data = req.body;
        const pool = await poolPromise;
        const request = pool.request();

        const columns = [
            'DrawingId', 'LineId', 'RevNo', 'SpoolNo', 'Item', 'ItemCode', 'Description', 
            'Size_Inch', 'MFA', 'SMIV', 'HMIV', 'SubContractor', 'IsMIVLinesIssuance', 
            'ComponentStatus', 'InsuType', 'InsuThickness', 'InsuLength', 'RussianDescription', 
            'Specification', 'Length_InchMeter', 'ComponentWeight', 'ComponentSurfaceArea', 
            'PaintSystem', 'UniqueComponentIdentifier', 'ErectionDrawingNo', 
            'Quantity', 'Length', 'Part_No', 'Description_Language', 'SheetNo'
        ];

        columns.forEach(col => {
            let value = col === 'Quantity' ? (data['DPLQty'] !== undefined ? data['DPLQty'] : data['Quantity']) : data[col];
            if (value === "" || value === undefined) value = null;

            if (col === 'Quantity') {
                request.input(col, sql.Decimal(18, 4), value !== null ? parseFloat(value) : null);
            } else {
                request.input(col, value);
            }
        });

        const query = `INSERT INTO ComponentDetails (${columns.join(', ')}) 
                       VALUES (${columns.map(col => '@' + col).join(', ')})`;
        
        await request.query(query);
        res.status(201).send({ message: 'Component integrated from JDE successfully' });
    } catch (err) {
        res.status(500).send("Integration Error: " + err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

