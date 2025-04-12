const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');

// Initialize PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER || "kafkauser",
  host: process.env.DB_HOST || "172.26.128.1",
  database: process.env.DB_NAME || "staging_dwh",
  password: process.env.DB_PASSWORD || "JsuA2d5sh4bhLAya",
  port: process.env.DB_PORT || 5458,
});

// Gemini API configuration - UPDATED FOR gemini-2.0-flash
const GEMINI_API_KEY = "AIzaSyCv9yxhvsVLi4Fkz0wzPbSfDIJlOPvmYNg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Function to get table schema specifically for split_pivot_all_full_real_test
async function getCustomTableSchema() {
  try {
    console.log("Getting schema for split_pivot_all_full_real_test...");
    
    // Check if table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'split_pivot_all_full_real_test'
      );
    `;
    
    const tableExists = await pool.query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log("Table split_pivot_all_full_real_test not found in public schema");
      
      // Try to find the table in any schema
      const findTableQuery = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'split_pivot_all_full_real_test';
      `;
      
      const tableLocations = await pool.query(findTableQuery);
      
      if (tableLocations.rows.length > 0) {
        console.log("Table found in schemas:", tableLocations.rows.map(r => r.table_schema));
        
        // Get columns using the first schema found
        const schema = tableLocations.rows[0].table_schema;
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        
        const columnsResult = await pool.query(columnsQuery, [schema, 'split_pivot_all_full_real_test']);
        
        // Get a sample of the data
        const sampleQuery = `
          SELECT * FROM "${schema}"."split_pivot_all_full_real_test" LIMIT 5;
        `;
        
        try {
          const sampleData = await pool.query(sampleQuery);
          console.log(`Found ${columnsResult.rows.length} columns in ${schema}.split_pivot_all_full_real_test`);
          
          return {
            schema: schema,
            tableName: 'split_pivot_all_full_real_test',
            columns: columnsResult.rows,
            sample: sampleData.rows
          };
        } catch (sampleError) {
          console.error('Error getting sample data:', sampleError);
          return {
            schema: schema,
            tableName: 'split_pivot_all_full_real_test',
            columns: columnsResult.rows,
            sample: []
          };
        }
      }
      
      // If still not found, try searching for tables with similar names
      const similarTablesQuery = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%pivot%' OR table_name LIKE '%split%'
        ORDER BY table_schema, table_name
        LIMIT 10;
      `;
      
      const similarTables = await pool.query(similarTablesQuery);
      
      if (similarTables.rows.length > 0) {
        // Use the first similar table as a fallback
        const fallbackSchema = similarTables.rows[0].table_schema;
        const fallbackTable = similarTables.rows[0].table_name;
        
        console.log(`Using fallback table: ${fallbackSchema}.${fallbackTable}`);
        
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        
        const columnsResult = await pool.query(columnsQuery, [fallbackSchema, fallbackTable]);
        
        try {
          const sampleQuery = `
            SELECT * FROM "${fallbackSchema}"."${fallbackTable}" LIMIT 5;
          `;
          const sampleData = await pool.query(sampleQuery);
          
          return {
            schema: fallbackSchema,
            tableName: fallbackTable,
            columns: columnsResult.rows,
            sample: sampleData.rows,
            isFallback: true
          };
        } catch (sampleError) {
          console.error('Error getting fallback sample data:', sampleError);
          return {
            schema: fallbackSchema,
            tableName: fallbackTable,
            columns: columnsResult.rows,
            sample: [],
            isFallback: true
          };
        }
      }
      
      return {
        _error: "Table split_pivot_all_full_real_test not found",
        _similar: similarTables.rows
      };
    }
    
    // Get columns
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'split_pivot_all_full_real_test'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await pool.query(columnsQuery);
    
    // Get a sample of the data
    try {
      const sampleQuery = `
        SELECT * FROM split_pivot_all_full_real_test LIMIT 5;
      `;
      const sampleData = await pool.query(sampleQuery);
      console.log(`Found ${columnsResult.rows.length} columns in public.split_pivot_all_full_real_test`);
      
      return {
        schema: 'public',
        tableName: 'split_pivot_all_full_real_test',
        columns: columnsResult.rows,
        sample: sampleData.rows
      };
    } catch (sampleError) {
      console.error('Error getting sample data from public schema:', sampleError);
      return {
        schema: 'public',
        tableName: 'split_pivot_all_full_real_test',
        columns: columnsResult.rows,
        sample: []
      };
    }
    
  } catch (error) {
    console.error('Error getting table schema:', error);
    
    // Last resort - try to find any table in the database
    try {
      const anyTableQuery = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        LIMIT 1;
      `;
      const anyTable = await pool.query(anyTableQuery);
      
      if (anyTable.rows.length > 0) {
        const schema = anyTable.rows[0].table_schema;
        const table = anyTable.rows[0].table_name;
        
        console.log(`Using any available table: ${schema}.${table}`);
        
        return {
          _error: "Original table not found. Using fallback.",
          schema: schema,
          tableName: table,
          isEmergencyFallback: true
        };
      }
    } catch (fallbackError) {
      console.error('Error getting any table:', fallbackError);
    }
    
    return {
      _error: "Failed to get table schema",
      _details: error.message
    };
  }
}

// Helper function to provide descriptions for columns
function getColumnDescription(columnName) {
  const descriptions = {
    'id': 'ID unik untuk setiap baris data',
    'code_fs': 'Kode laporan keuangan',
    'code_calk': 'Kode catatan atas laporan keuangan',
    'coa_holding': 'Kode akun holding',
    'description': 'Deskripsi atau nama item keuangan',
    'type': 'Tipe data atau kategori',
    'tahun': 'Tahun laporan (text, bukan integer)', 
    'bulan': 'Bulan laporan (1-12, text, bukan integer)',
    'bki': 'Nilai BKI (numeric)',
    'sci': 'Nilai SCI (numeric)',
    'si': 'Nilai SI (numeric)',
    'combine': 'Nilai gabungan (numeric)',
    'dr': 'Debit (integer)',
    'cr': 'Credit (integer)',
    'konsol': 'Nilai konsolidasi (numeric)'
  };
  
  return descriptions[columnName] || 'No description available';
}

// Function to execute SQL query and get results
async function executeQuery(query, schema = 'public') {
    try {
      console.log("Original query:", query);
      
      // Clean the query thoroughly
      const cleanedQuery = query.replace(/```sql\s*/gi, '')
                              .replace(/```/g, '')
                              .replace(/`/g, '')
                              .replace(/--.*$/gm, '')
                              .replace(/;/g, '') // Remove semicolons
                              .trim();
                              
      console.log("Cleaned query:", cleanedQuery);
      
      // Security check to prevent dangerous queries
      const lowerQuery = cleanedQuery.toLowerCase().trim();
      console.log("Starts with SELECT:", lowerQuery.startsWith('select'));
      
      // Improved SQL injection protection
      if (lowerQuery.match(/\b(drop|delete|truncate|update|insert|alter|create|grant|revoke)\b/i)) {
        console.warn("Dangerous query detected:", cleanedQuery);
        return { error: "Query tidak diperbolehkan karena alasan keamanan" };
      }
      
      // Validate SELECT
      if (!lowerQuery.startsWith('select')) {
        console.warn("Non-SELECT query detected:", cleanedQuery);
        return { error: "Hanya query SELECT yang diperbolehkan" };
      }
      
      // Ensure a well-structured query by checking for basic SQL clauses
      if (!lowerQuery.includes('from')) {
        console.warn("Invalid query structure (missing FROM):", cleanedQuery);
        return { error: "Query tidak valid, struktur query tidak lengkap" };
      }
      
      // Initialize limitedQuery here
      let limitedQuery = cleanedQuery;
      
      // Fix data type mismatches for text columns
      if (lowerQuery.includes('tahun =') || lowerQuery.includes('bulan =')) {
        limitedQuery = limitedQuery
          .replace(/tahun\s*=\s*(\d+)/g, "tahun = '$1'")
          .replace(/bulan\s*=\s*(\d+)/g, "bulan = '$1'");
        console.log("Fixed data type mismatch for text columns. Modified query:", limitedQuery);
      }
      
      // Limit the number of rows returned
      if (!lowerQuery.includes(' limit ')) {
        limitedQuery = limitedQuery + ' LIMIT 100';
        console.log("Added LIMIT clause. Modified query:", limitedQuery);
      }
      
      // Schema qualification
      if (schema !== 'public' && lowerQuery.includes('split_pivot_all_full_real_test') && 
          !lowerQuery.includes(`"${schema}"."split_pivot_all_full_real_test"`)) {
        
        // This is a simple replacement and might not work for all complex queries
        limitedQuery = limitedQuery.replace(
          /split_pivot_all_full_real_test/gi, 
          `"${schema}"."split_pivot_all_full_real_test"`
        );
        
        console.log("Added schema to table references. Modified query:", limitedQuery);
      }
      
      // Debugging
      console.log("Final query to execute:", limitedQuery);
      
      // Execute with timeout protection
      const result = await Promise.race([
        pool.query(limitedQuery),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Query timeout after 30 seconds")), 30000)
        )
      ]);
      
      console.log(`Query executed successfully. Returned ${result.rows.length} rows`);
      return result.rows;
    } catch (error) {
      console.error('Error executing query:', error);
      console.error('Query that caused error:', query);
      
      // Enhanced error messages for common SQL errors
      let errorMessage = error.message;
      const errorCode = error.code;
      
      // Provide more user-friendly error messages
      if (errorCode === '42P01') {
        errorMessage = "Tabel yang direferensikan tidak ditemukan dalam database";
      } else if (errorCode === '42703') {
        errorMessage = "Kolom yang direferensikan tidak ada dalam tabel";
      } else if (errorCode === '42601') {
        errorMessage = "Error sintaks SQL. Coba perbaiki struktur query";
      } else if (errorCode === '22P02') {
        errorMessage = "Nilai yang tidak valid untuk tipe data kolom";
      } else if (errorCode === '42883') {
        errorMessage = "Ketidakcocokan tipe data dalam perbandingan. Pastikan tipe data sesuai.";
      }
      
      return { 
        error: errorMessage,
        query: query,
        code: errorCode
      };
    }
  }
// Enhanced fallback method with more patterns
async function generateSQLQueryFallback(question, tableInfo) {
  const schema = tableInfo.schema || 'public';
  const tableName = tableInfo.tableName || 'split_pivot_all_full_real_test';
  const fullTableName = `"${schema}"."${tableName}"`;
  
  // Normalize the question for easier pattern matching
  const normalizedQuestion = question.toLowerCase();
  let sqlQuery = "";
  
  // Check for common patterns in the question
  if (normalizedQuestion.includes('total') && normalizedQuestion.includes('konsol')) {
    if (normalizedQuestion.includes('tahun') && /\d{4}/.test(normalizedQuestion)) {
      const year = normalizedQuestion.match(/\d{4}/)[0];
      sqlQuery = `SELECT SUM(konsol) as total_konsol FROM ${fullTableName} WHERE tahun = ${year}`;
    } else if (normalizedQuestion.includes('bulan') && /\b(1[0-2]|[1-9])\b/.test(normalizedQuestion)) {
      const month = normalizedQuestion.match(/\b(1[0-2]|[1-9])\b/)[0];
      sqlQuery = `SELECT SUM(konsol) as total_konsol FROM ${fullTableName} WHERE bulan = ${month}`;
    } else {
      sqlQuery = `SELECT SUM(konsol) as total_konsol FROM ${fullTableName}`;
    }
  } 
  else if (normalizedQuestion.includes('total') && normalizedQuestion.includes('bki')) {
    // For BKI questions with description filters
    const descriptionMatches = [
      { pattern: /total liabilitas/i, value: 'TOTAL LIABILITAS' },
      { pattern: /kas/i, value: '%Kas%' },
      { pattern: /ekuitas/i, value: '%ekuitas%' },
      { pattern: /aset/i, value: '%aset%' },
      { pattern: /piutang/i, value: '%piutang%' },
      { pattern: /hutang/i, value: '%hutang%' }
    ];
    
    // Find if any description is mentioned
    let descriptionCondition = '';
    for (const match of descriptionMatches) {
      if (match.pattern.test(normalizedQuestion)) {
        // If exact match needed
        if (match.value.startsWith('%')) {
          descriptionCondition = `AND description LIKE '${match.value}'`;
        } else {
          descriptionCondition = `AND description = '${match.value}'`;
        }
        break;
      }
    }
    
    // Check for year filter
    let yearCondition = '';
    if (normalizedQuestion.includes('tahun') && /\d{4}/.test(normalizedQuestion)) {
      const year = normalizedQuestion.match(/\d{4}/)[0];
      yearCondition = `WHERE tahun = ${year} `;
    } else {
      yearCondition = 'WHERE 1=1 ';
    }
    
    sqlQuery = `SELECT SUM(bki) as total_bki FROM ${fullTableName} ${yearCondition}${descriptionCondition}`;
  }
  else if (normalizedQuestion.includes('bandingkan') || normalizedQuestion.includes('perbandingan')) {
    // For comparison queries
    if (normalizedQuestion.includes('bki') && normalizedQuestion.includes('sci')) {
      if (normalizedQuestion.includes('bulan')) {
        sqlQuery = `SELECT bulan, SUM(bki) as total_bki, SUM(sci) as total_sci FROM ${fullTableName} GROUP BY bulan ORDER BY bulan`;
      } else {
        sqlQuery = `SELECT tahun, SUM(bki) as total_bki, SUM(sci) as total_sci FROM ${fullTableName} GROUP BY tahun ORDER BY tahun`;
      }
    }
  }
  else if (normalizedQuestion.includes('tertinggi') || normalizedQuestion.includes('maksimum') || normalizedQuestion.includes('max')) {
    if (normalizedQuestion.includes('konsol')) {
      sqlQuery = `SELECT MAX(konsol) as nilai_tertinggi, description FROM ${fullTableName} GROUP BY description ORDER BY nilai_tertinggi DESC LIMIT 1`;
      
      if (normalizedQuestion.includes('tahun') && /\d{4}/.test(normalizedQuestion)) {
        const year = normalizedQuestion.match(/\d{4}/)[0];
        sqlQuery = `SELECT MAX(konsol) as nilai_tertinggi, description FROM ${fullTableName} WHERE tahun = ${year} GROUP BY description ORDER BY nilai_tertinggi DESC LIMIT 1`;
      }
    } else if (normalizedQuestion.includes('bki')) {
      sqlQuery = `SELECT MAX(bki) as nilai_tertinggi, description FROM ${fullTableName} GROUP BY description ORDER BY nilai_tertinggi DESC LIMIT 1`;
    }
  }
  else if (normalizedQuestion.includes('terendah') || normalizedQuestion.includes('minimum') || normalizedQuestion.includes('min')) {
    if (normalizedQuestion.includes('konsol')) {
      sqlQuery = `SELECT MIN(konsol) as nilai_terendah, description FROM ${fullTableName} WHERE konsol != 0 GROUP BY description ORDER BY nilai_terendah ASC LIMIT 1`;
    }
  }
  else {
    // Default query - return summarized data
    sqlQuery = `SELECT tahun, bulan, COUNT(*) as jumlah_transaksi, SUM(konsol) as total_konsol FROM ${fullTableName} GROUP BY tahun, bulan ORDER BY tahun, bulan LIMIT 10`;
  }
  
  console.log("Generated SQL query from enhanced fallback:", sqlQuery);
  return sqlQuery;
}

// Enhanced SQL query generation with comprehensive prompt
async function generateSQLQuery(question, tableInfo) {
  try {
    console.log("Generating SQL query for question:", question);
    
    // Check if tableInfo has errors
    if (tableInfo._error && !tableInfo.schema) {
      console.error("Table info error:", tableInfo._error);
      throw new Error(`Table schema error: ${tableInfo._error}`);
    }
    
    // Construct a comprehensive column description for Gemini
    const columnDescriptions = tableInfo.columns ? 
      tableInfo.columns.map(col => 
        `${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' - nullable' : ''} - 
         ${getColumnDescription(col.column_name)}`
      ).join('\n') : 
      "Column information not available";
    
    // Get sample data with more examples
    const sampleDataJson = tableInfo.sample ? 
      JSON.stringify(tableInfo.sample.slice(0, 3), null, 2) : 
      "Sample data not available";

    // Create a more comprehensive prompt with examples
// The problematic line is in the prompt text, where a backtick is causing syntax issues
// Original problematic line:
// - Hindari penggunaan markdown atau backticks (`) dalam response.

// Fixed line:
// Use proper string escaping for backtick character
const promptText = `
  Kamu adalah asisten SQL yang sangat ahli dan akurat. Tugasmu adalah mengubah pertanyaan dalam bahasa Indonesia menjadi query SQL yang valid dan tepat untuk PostgreSQL.
  
  Tabel: ${tableInfo.schema}.${tableInfo.tableName}
  
  Detail kolom-kolom:
  ${columnDescriptions}
  
  Contoh data:
  ${sampleDataJson}
  
  Contoh pertanyaan dan query yang benar:
  1. Pertanyaan: "Tampilkan total konsol"
     Query: SELECT SUM(konsol) AS total_konsol FROM ${tableInfo.schema}.${tableInfo.tableName};
  
  2. Pertanyaan: "Berapa nilai BKI untuk TOTAL LIABILITAS pada tahun 2024" 
     Query: SELECT SUM(bki) AS total_bki FROM ${tableInfo.schema}.${tableInfo.tableName} WHERE tahun = 2024 AND description = 'TOTAL LIABILITAS';
  
  3. Pertanyaan: "Tampilkan data ekuitas per bulan"
     Query: SELECT bulan, SUM(konsol) AS total_ekuitas FROM ${tableInfo.schema}.${tableInfo.tableName} WHERE description LIKE '%ekuitas%' GROUP BY bulan ORDER BY bulan;
  
  4. Pertanyaan: "Bandingkan total BKI dan SCI per tahun"
     Query: SELECT tahun, SUM(bki) AS total_bki, SUM(sci) AS total_sci FROM ${tableInfo.schema}.${tableInfo.tableName} GROUP BY tahun ORDER BY tahun;
  
  Perhatikan bahwa:
    - Kolom tahun dan bulan bertipe TEXT, jadi gunakan tanda kutip seperti: WHERE tahun = '2024'
    - Untuk pertanyaan yang membandingkan, gunakan SUM atau aggregasi lain yang sesuai
    - Untuk pertanyaan yang mencari data dalam kolom 'description', gunakan kondisi LIKE atau = sesuai kebutuhan
    - Jangan menambahkan komentar atau penjelasan, hanya query SQL murni saja
  
  Pertanyaan pengguna: ${question}
  
  Berikan query SQL murni yang valid (tanpa penjelasan, tanpa markdown, tanpa backticks) untuk menjawab pertanyaan tersebut:
`;

    try {
      console.log("Sending enhanced request to Gemini API for SQL generation...");
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: promptText }]
          }]
        }
      );

      // Extract SQL query from response
      if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
        console.error("Unexpected Gemini API response format:", JSON.stringify(response.data));
        throw new Error("Invalid response from Gemini API");
      }
      
      // Clean the generated SQL query thoroughly
      let generatedText = response.data.candidates[0].content.parts[0].text;
      let sqlQuery = generatedText.trim();
      
      // Remove any markdown formatting, backticks, and SQL comments
      sqlQuery = sqlQuery.replace(/tahun\s*=\s*'(\d+)'/g, "tahun = $1")
                         .replace(/```/g, '')
                         .replace(/`/g, '')
                         .replace(/--.*$/gm, '')
                         .trim();
      
      // If the query doesn't start with SELECT, extract it
      if (!sqlQuery.toLowerCase().startsWith('select')) {
        const selectMatch = sqlQuery.match(/select[\s\S]+/i);
        if (selectMatch) {
          sqlQuery = selectMatch[0];
          console.log("Extracted SELECT statement from response:", sqlQuery);
        } else {
          console.log("Generated query doesn't start with SELECT, using fallback");
          return await generateSQLQueryFallback(question, tableInfo);
        }
      }
      
      console.log("Final cleaned SQL query from Gemini:", sqlQuery);
      return sqlQuery;
    } catch (apiError) {
      console.error('Error from Gemini API:', apiError);
      console.log('Falling back to enhanced local SQL generation');
      
      // Use the enhanced fallback
      return await generateSQLQueryFallback(question, tableInfo);
    }
  } catch (error) {
    console.error('Error in generateSQLQuery:', error);
    
    // Always fall back to enhanced local method if anything fails
    return await generateSQLQueryFallback(question, tableInfo);
  }
}

// Enhanced fallback for formatting responses with better number formatting
async function formatResponseFallback(question, sqlQuery, queryResults, tableInfo) {
  let formattedResponse = "";
  
  // Helper function to format numbers with Indonesian locale
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value !== 'number') {
      // Try to convert to number if it's a string that looks like a number
      if (/^-?\d+(\.\d+)?$/.test(String(value))) {
        value = parseFloat(value);
      } else {
        return value;
      }
    }
    return Number(value).toLocaleString('id-ID');
  };
  
  // Check if query results contain an error
  if (queryResults.error) {
    formattedResponse = `Maaf, terjadi error saat menjalankan query: ${queryResults.error}. Silakan coba pertanyaan lain.`;
  } 
  else if (Array.isArray(queryResults) && queryResults.length === 0) {
    formattedResponse = `Tidak ada data yang ditemukan untuk pertanyaan "${question}". Mungkin tidak ada data untuk kriteria yang Anda cari.`;
  } 
  else if (sqlQuery.includes("MAX(konsol)") || sqlQuery.includes("nilai_tertinggi")) {
    // Formatting for konsol tertinggi
    if (queryResults[0].nilai_tertinggi || queryResults[0].max) {
      const nilai = queryResults[0].nilai_tertinggi || queryResults[0].max;
      formattedResponse = `Nilai konsol tertinggi adalah ${formatNumber(nilai)}`;
      if (queryResults[0].tahun) {
        formattedResponse += ` pada tahun ${queryResults[0].tahun}`;
      }
      if (queryResults[0].description) {
        formattedResponse += ` untuk "${queryResults[0].description}"`;
      }
      formattedResponse += ".";
    } else {
      formattedResponse = "Tidak ada data konsol yang ditemukan.";
    }
  }
  else if (sqlQuery.includes("MIN(konsol)") || sqlQuery.includes("nilai_terendah")) {
    // Formatting for konsol terendah
    if (queryResults[0].nilai_terendah || queryResults[0].min) {
      const nilai = queryResults[0].nilai_terendah || queryResults[0].min;
      formattedResponse = `Nilai konsol terendah adalah ${formatNumber(nilai)}`;
      if (queryResults[0].tahun) {
        formattedResponse += ` pada tahun ${queryResults[0].tahun}`;
      }
      if (queryResults[0].description) {
        formattedResponse += ` untuk "${queryResults[0].description}"`;
      }
      formattedResponse += ".";
    } else {
      formattedResponse = "Tidak ada data konsol yang ditemukan.";
    }
  }
  else if (sqlQuery.includes("SUM(konsol)") && (sqlQuery.toLowerCase().includes("total_konsol") || sqlQuery.toLowerCase().includes("as total"))) {
    // Formatting for total konsol
    if (queryResults[0].total_konsol || queryResults[0].sum) {
      const total = queryResults[0].total_konsol || queryResults[0].sum;
      formattedResponse = `Total nilai konsol adalah ${formatNumber(total)}`;
      
      // Add conditions if present
      if (queryResults[0].tahun) {
        formattedResponse += ` pada tahun ${queryResults[0].tahun}`;
      }
      if (queryResults[0].bulan) {
        formattedResponse += ` bulan ${queryResults[0].bulan}`;
      }
      
      formattedResponse += ".";
    } else {
      formattedResponse = "Tidak bisa menghitung total konsol.";
    }
  }
  else if (sqlQuery.includes("SUM(bki)") && sqlQuery.toLowerCase().includes("total_bki")) {
    // Formatting for total BKI
    if (queryResults[0].total_bki) {
      formattedResponse = `Total nilai BKI`;
      
      // Add description condition if present in the query
      if (sqlQuery.includes("description")) {
        if (sqlQuery.includes("TOTAL LIABILITAS")) {
          formattedResponse += ` untuk TOTAL LIABILITAS`;
        } else if (sqlQuery.includes("Kas") || sqlQuery.includes("%Kas%")) {
          formattedResponse += ` untuk Kas`;
        } else if (sqlQuery.includes("ekuitas") || sqlQuery.includes("%ekuitas%")) {
          formattedResponse += ` untuk Ekuitas`;
        }
      }
      
      // Add time period if specified
      if (sqlQuery.includes("tahun =")) {
        const yearMatch = sqlQuery.match(/tahun\s*=\s*(\d{4})/i);
        if (yearMatch) {
          formattedResponse += ` pada tahun ${yearMatch[1]}`;
        }
      }
      
      formattedResponse += ` adalah ${formatNumber(queryResults[0].total_bki)}.`;
    } else {
      formattedResponse = "Tidak ada data BKI yang ditemukan.";
    }
  } 
  else if (sqlQuery.includes("bulan") && sqlQuery.includes("GROUP BY bulan")) {
    // Formatting for monthly data
    formattedResponse = "Data per bulan:\n\n";
    queryResults.forEach((row) => {
      formattedResponse += `Bulan ${row.bulan}: `;
      
      // Add all numeric values with proper formatting
      Object.keys(row).forEach(key => {
        if (key !== 'bulan') {
          const value = formatNumber(row[key]);
          formattedResponse += `${key.replace('total_', '').replace('_', ' ')}: ${value}, `;
        }
      });
      
      formattedResponse = formattedResponse.slice(0, -2) + '\n';
    });
  }
  else if (sqlQuery.includes("description") && sqlQuery.includes("SUM(bki)")) {
    // Formatting for BKI by description
    formattedResponse = "Informasi nilai BKI per deskripsi:\n\n";
    queryResults.forEach((row, index) => {
      formattedResponse += `${index + 1}. ${row.description}: ${formatNumber(row.sum || row.total || row.total_bki)}\n`;
    });
  }
  else {
    // Default formatting with improved number formatting
    // Default formatting with improved number formatting
    formattedResponse = `Berikut adalah hasil query untuk pertanyaan Anda:\n\n`;
    queryResults.forEach((row, index) => {
      formattedResponse += `${index + 1}. `;
      Object.keys(row).forEach(key => {
        const value = typeof row[key] === 'number' || /^-?\d+(\.\d+)?$/.test(String(row[key])) ? 
                     formatNumber(row[key]) : row[key];
        formattedResponse += `${key.replace(/_/g, ' ')}: ${value}, `;
      });
      formattedResponse = formattedResponse.slice(0, -2) + '\n';
    });
  }
  
  return formattedResponse;
}

// Format query results into a readable response using Gemini API with enhanced prompt
async function formatResponse(question, sqlQuery, queryResults, tableInfo) {
  try {
    console.log("Formatting response...");
    
    // Check if query results contain an error
    let promptText;
    if (queryResults.error) {
      promptText = `
        Kamu adalah asisten database yang berbahasa Indonesia. Tugasmu adalah menjelaskan hasil query database dengan cara yang mudah dipahami.
        
        Pertanyaan pengguna: ${question}
        
        Query SQL yang digunakan: ${sqlQuery}
        
        Terjadi error: ${queryResults.error}
        
        Tabel: ${tableInfo.schema}.${tableInfo.tableName}
        
        Berikan jawaban dalam bahasa Indonesia yang menjelaskan bahwa terjadi error saat mencoba menjawab pertanyaan pengguna.
        Jelaskan kemungkinan penyebabnya dengan bahasa yang sederhana dan berikan saran untuk memperbaiki pertanyaan jika memungkinkan.
        Usahakan jawaban singkat, padat, dan langsung ke intinya.
      `;
    } else if (Array.isArray(queryResults) && queryResults.length === 0) {
      promptText = `
        Kamu adalah asisten database yang berbahasa Indonesia. Tugasmu adalah menjelaskan hasil query database dengan cara yang mudah dipahami.
        
        Pertanyaan pengguna: ${question}
        
        Query SQL yang digunakan: ${sqlQuery}
        
        Hasil query: Tidak ada data yang ditemukan
        
        Tabel: ${tableInfo.schema}.${tableInfo.tableName}
        
        Berikan jawaban singkat dalam bahasa Indonesia yang menjelaskan bahwa tidak ada data yang ditemukan untuk pertanyaan tersebut.
        Berikan alternatif pertanyaan atau saran yang mungkin dapat membantu pengguna mendapatkan informasi yang mereka cari.
        Usahakan jawaban singkat, padat, dan langsung ke intinya.
      `;
    } else {
      promptText = `
        Kamu adalah asisten database yang berbahasa Indonesia. Tugasmu adalah menjelaskan hasil query database dengan cara yang mudah dipahami.
        
        Pertanyaan pengguna: ${question}
        
        Query SQL yang digunakan: ${sqlQuery}
        
        Hasil query: ${JSON.stringify(queryResults, null, 2)}
        
        Tabel: ${tableInfo.schema}.${tableInfo.tableName}
        
        Berikan jawaban yang jelas, singkat dan langsung pada intinya dalam bahasa Indonesia. Jelaskan bagaimana data menjawab pertanyaan pengguna.
        Berikan analisis singkat jika relevan, seperti total, rata-rata, atau tren yang terlihat.
        Format angka dengan pemisah ribuan untuk kemudahan membaca (contoh: 1.000.000 bukan 1000000).
        Usahakan jawaban singkat, padat, dan langsung ke intinya.
      `;
    }

    try {
      console.log("Sending formatting request to Gemini API...");
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: promptText }]
          }]
        }
      );

      if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
        console.error("Unexpected Gemini API response format:", JSON.stringify(response.data));
        throw new Error("Invalid response from Gemini API");
      }

      const formattedResponse = response.data.candidates[0].content.parts[0].text;
      console.log("Formatted response generated successfully by Gemini");
      return formattedResponse;
    } catch (apiError) {
      console.error('Error from Gemini API during formatting:', apiError);
      console.log('Falling back to enhanced local formatting');
      
      // Fallback to local formatting
      return await formatResponseFallback(question, sqlQuery, queryResults, tableInfo);
    }
  } catch (error) {
    console.error('Error in formatResponse:', error);
    
    // Always fall back to local formatting if anything fails
    return await formatResponseFallback(question, sqlQuery, queryResults, tableInfo);
  }
}

// Process user question route
router.post('/ask', async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);
  
  if (!question) {
    console.warn("Empty question received");
    return res.status(400).json({ error: 'Pertanyaan diperlukan' });
  }
  
  try {
    // Get table info for split_pivot_all_full_real_test
    console.log("Getting table info");
    const tableInfo = await getCustomTableSchema();
    
    // Check if table info retrieval encountered errors
    if (tableInfo._error && !tableInfo.schema) {
      console.error("Table info error:", tableInfo._error);
      
      // Special case: if we found similar tables, include that in the response
      if (tableInfo._similar && tableInfo._similar.length > 0) {
        const similarTables = tableInfo._similar.map(t => `${t.table_schema}.${t.table_name}`).join(', ');
        
        const errorResponse = `Maaf, tabel split_pivot_all_full_real_test tidak ditemukan dalam database. Namun, saya menemukan beberapa tabel serupa yang mungkin berisi data yang Anda cari: ${similarTables}. Silakan coba tanyakan tentang salah satu tabel tersebut.`;
        
        return res.json({
          question,
          sqlQuery: "-- Table not found",
          answer: errorResponse,
          rawResults: []
        });
      }
      
      throw new Error(`Table schema error: ${tableInfo._error}`);
    }
    
    // Generate SQL query from the question
    console.log("Generating SQL query");
    const sqlQuery = await generateSQLQuery(question, tableInfo);
    
    // Execute the generated query
    console.log("Executing query");
    const queryResults = await executeQuery(sqlQuery, tableInfo.schema);
    
    // Format results into a readable response
    console.log("Formatting response");
    const formattedResponse = await formatResponse(question, sqlQuery, queryResults, tableInfo);
    
    console.log("Sending successful response");
    res.json({
      question,
      sqlQuery,
      answer: formattedResponse,
      rawResults: queryResults
    });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(200).json({ 
      error: 'Terjadi kesalahan saat memproses pertanyaan',
      details: error.message,
      sqlQuery: "ERROR",
      answer: `Maaf, terjadi kesalahan saat memproses pertanyaan Anda: ${error.message}. Silakan coba lagi nanti.`,
      rawResults: []
    });
  }
});

// Get table columns endpoint
router.get('/table-info', async (req, res) => {
  try {
    const tableInfo = await getCustomTableSchema();
    res.json(tableInfo);
  } catch (error) {
    console.error('Error getting table info:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat mengambil informasi tabel',
      details: error.message
    });
  }
});

// Test endpoint to check if chatbot routes are working
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW() as time');
    
    // Check if table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'split_pivot_all_full_real_test'
      );
    `;
    const tableExists = await pool.query(tableCheckQuery);
    
    // Test Gemini API connection
    try {
      const geminiResponse = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: "Reply with: Test successful! Gemini API is working." }]
          }]
        }
      );
      
      res.json({
        status: 'ok',
        database: {
          connected: true,
          time: dbResult.rows[0].time,
          table_exists: tableExists.rows[0].exists
        },
        gemini: {
          connected: true,
          response: geminiResponse.data.candidates[0].content.parts[0].text
        }
      });
    } catch (geminiError) {
      console.error('Gemini API test failed:', geminiError.response?.data || geminiError.message);
      
      res.json({
        status: 'partial',
        database: {
          connected: true,
          time: dbResult.rows[0].time,
          table_exists: tableExists.rows[0].exists
        },
        gemini: {
          connected: false,
          error: geminiError.response?.data || geminiError.message
        },
        message: "Database connection successful, but Gemini API test failed. Fallback mechanism will be used."
      });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      database: {
        connected: false,
        error: error.message.includes('database') ? error.message : null
      },
      gemini: {
        connected: false,
        error: error.message.includes('Gemini') ? error.message : null
      }
    });
  }
});

// Endpoint untuk testing koneksi database
router.get('/test-database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    
    // Get list of tables
    const tablesQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      LIMIT 10;
    `;
    const tables = await pool.query(tablesQuery);
    
    res.json({
      success: true,
      time: result.rows[0].time,
      tables: tables.rows
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint untuk testing API Gemini
router.post('/test-gemini', async (req, res) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: "Reply with: Test successful! Gemini API is working." }]
        }]
      }
    );
    
    res.json({
      success: true,
      model: "gemini-2.0-flash",
      message: response.data.candidates[0].content.parts[0].text,
      rawResponse: response.data
    });
  } catch (error) {
    console.error('Gemini API test failed:', error.response?.data || error.message);
    res.status(200).json({
      success: false,
      error: error.response?.data || error.message,
      message: "Fallback mechanism will be used for SQL generation and response formatting."
    });
  }
});

// Endpoint untuk testing tabel split_pivot_all_full_real_test
router.get('/test-table', async (req, res) => {
  try {
    // Check if table exists in any schema
    const findTableQuery = `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'split_pivot_all_full_real_test'
      ORDER BY table_schema;
    `;
    
    const tableLocations = await pool.query(findTableQuery);
    
    if (tableLocations.rows.length === 0) {
      return res.json({
        success: false,
        message: "Table 'split_pivot_all_full_real_test' not found in any schema."
      });
    }

    // Get schema of the first matching table
    const schema = tableLocations.rows[0].table_schema;
        
    // Get columns
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
      LIMIT 20;
    `;

    const columns = await pool.query(columnsQuery, [schema, 'split_pivot_all_full_real_test']);

    // Get sample data
    const sampleQuery = `
      SELECT * FROM "${schema}"."split_pivot_all_full_real_test"
      LIMIT 3;
    `;

    const sampleData = await pool.query(sampleQuery);

    res.json({
      success: true,
      schema: schema,
      table: 'split_pivot_all_full_real_test',
      columnCount: columns.rows.length,
      columns: columns.rows,
      sampleData: sampleData.rows
    });
  } catch (error) {
    console.error('Table test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;