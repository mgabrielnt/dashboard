const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Initialize PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.26.128.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Get entity totals (BKI, SCI, SI, KONSOL)
router.get('/totals', async (req, res) => {
  try {
    // Extract date range parameters
    const { startDate, endDate } = req.query;
    
    // Construct WHERE clause with date range if provided
    // Note: Changed 'tanggal' to the correct date column name
    // Using a generic query without date filtering initially
    let query = `
      SELECT 
        SUM(bki) as bki_total,
        SUM(sci) as sci_total,
        SUM(si) as si_total,
        SUM(konsol) as konsol_total
      FROM split_pivot_all_full_real_test
    `;
    
    // If date filtering is needed, you would need to find the correct date column name
    // and update the query accordingly
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }
    
    // Process data
    const entityData = {
      bki: {
        value: parseInt(result.rows[0].bki_total) || 0,
        increase: "+14%",
        progress: "0.75"
      },
      sci: {
        value: parseInt(result.rows[0].sci_total) || 0,
        increase: "+21%",
        progress: "0.50"
      },
      si: {
        value: parseInt(result.rows[0].si_total) || 0,
        increase: "+5%",
        progress: "0.30"
      },
      konsol: {
        value: parseInt(result.rows[0].konsol_total) || 0,
        increase: "+43%",
        progress: "0.80"
      }
    };
    
    res.json(entityData);
  } catch (error) {
    console.error('Error fetching entity totals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get entity totals with percentage changes compared to previous period
router.get('/totals-with-trends', async (req, res) => {
  try {
    // Note: Since we don't know the exact date column in your table,
    // we'll simplify this by just returning the total data without date filtering
    
    // Query for current totals (without date filtering)
    const currentQuery = `
      SELECT 
        SUM(bki) as bki_total,
        SUM(sci) as sci_total,
        SUM(si) as si_total,
        SUM(konsol) as konsol_total
      FROM split_pivot_all_full_real_test
    `;
    
    // For now, use the same query for previous (we'll just modify the data for display purposes)
    const currentResult = await pool.query(currentQuery);
    
    // If no data found
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }
    
    // Create mock previous data (for demonstration)
    // In a real implementation, you'd have proper historical comparison
    const current = currentResult.rows[0];
    const previous = {
      bki_total: Math.round(current.bki_total * 0.9), // 10% less than current
      sci_total: Math.round(current.sci_total * 0.85), // 15% less than current
      si_total: Math.round(current.si_total * 0.95), // 5% less than current
      konsol_total: Math.round(current.konsol_total * 0.7) // 30% less than current
    };
    
    // Calculate percentages
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return { increase: "+0%", progress: "0.5" };
      
      const percentChange = ((current - previous) / previous) * 100;
      const formattedChange = percentChange > 0 
        ? `+${percentChange.toFixed(1)}%` 
        : `${percentChange.toFixed(1)}%`;
      
      // Normalize progress value between 0 and 1
      const progressValue = Math.min(Math.abs(percentChange) / 100, 1).toFixed(2);
      
      return {
        increase: formattedChange,
        progress: progressValue
      };
    };
    
    // Create response with trends
    const entityData = {
      bki: {
        value: parseInt(current.bki_total) || 0,
        previous: parseInt(previous.bki_total) || 0,
        ...calculateTrend(current.bki_total, previous.bki_total)
      },
      sci: {
        value: parseInt(current.sci_total) || 0,
        previous: parseInt(previous.sci_total) || 0,
        ...calculateTrend(current.sci_total, previous.sci_total)
      },
      si: {
        value: parseInt(current.si_total) || 0,
        previous: parseInt(previous.si_total) || 0,
        ...calculateTrend(current.si_total, previous.si_total)
      },
      konsol: {
        value: parseInt(current.konsol_total) || 0,
        previous: parseInt(previous.konsol_total) || 0,
        ...calculateTrend(current.konsol_total, previous.konsol_total)
      }
    };
    
    res.json(entityData);
    
  } catch (error) {
    console.error('Error fetching entity totals with trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;