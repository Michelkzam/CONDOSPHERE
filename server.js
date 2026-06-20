const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, 'data', 'db_config.json');
const JSON_DB_FILE = path.join(__dirname, 'data', 'db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(JSON_DB_FILE))) {
  fs.mkdirSync(path.dirname(JSON_DB_FILE), { recursive: true });
}

// Default JSON Database content if fallback is used
const DEFAULT_JSON_DB = {
  profiles: [
    { id: 'prof-1', name: 'Administrador', is_active: true, permissions: { Dashboard: true, Condomínio: true, Financeiro: true, Portaria: true, "RH & Pessoal": true, Comunicação: true, Configurações: true } },
    { id: 'prof-2', name: 'Colaborador', is_active: true, permissions: { Dashboard: true, Condomínio: true, Financeiro: false, Portaria: true, "RH & Pessoal": true, Comunicação: true, Configurações: false } },
    { id: 'prof-3', name: 'Morador', is_active: true, permissions: { Dashboard: true, Condomínio: true, Financeiro: false, Portaria: false, "RH & Pessoal": true, Comunicação: true, Configurações: false } },
    { id: 'prof-4', name: 'Portaria', is_active: true, permissions: { Dashboard: true, Condomínio: true, Financeiro: false, Portaria: true, "RH & Pessoal": false, Comunicação: true, Configurações: false } }
  ],
  users: [
    {
      id: "ee476d36-f722-4772-abd9-c2d1735d9ae4",
      full_name: "Administrador Geral",
      username: "administrador",
      email: "admin@condosphere.com",
      profile_id: "prof-1",
      phone: null,
      cpf: "AdminMaster",
      is_active: true
    }
  ],
  residences: [],
  residents: [],
  vehicles: [],
  common_areas: [],
  reservations: [],
  portaria_logs: [],
  payables: [],
  receivables: [],
  employees: [],
  providers: [],
  assemblies: [],
  company_settings: []
};

// PostgreSQL connection pool instance
let pgPool = null;
let usePostgres = false;

// SQLite instance
let dbSQLite = null;
let useSQLite = false;

// Check if Database config is present
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (config.db_type === 'postgres') {
      pgPool = new Pool({
        host: config.host || 'localhost',
        port: config.port || 5432,
        user: config.user || 'postgres',
        password: config.password,
        database: config.database || 'condosphere'
      });
      usePostgres = true;
      console.log(`[DATABASE] Configuração do PostgreSQL detectada: ${config.host}:${config.port}`);
    } else if (config.db_type === 'sqlite') {
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = config.database || path.join(__dirname, 'data', 'condosphere.db');
      
      // Ensure data directory exists
      if (!fs.existsSync(path.dirname(dbPath))) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      }

      dbSQLite = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("[SQLITE ERROR] Falha ao abrir banco de dados SQLite:", err.message);
        } else {
          console.log(`[DATABASE] Banco de Dados SQLite Ativo: ${dbPath}`);
          dbSQLite.run("PRAGMA foreign_keys = ON;");
        }
      });
      useSQLite = true;
    }
  } catch (err) {
    console.error("[DATABASE ERROR] Falha ao ler configuração do banco de dados. Usando fallback JSON.", err.message);
  }
}

// Automatically initialize SQLite database schema if active
if (useSQLite && dbSQLite) {
  const schemaFile = path.join(__dirname, 'sqlite_schema.sql');
  if (fs.existsSync(schemaFile)) {
    try {
      const ddl = fs.readFileSync(schemaFile, 'utf8');
      dbSQLite.exec(ddl, (err) => {
        if (err) {
          console.error("[SQLITE SCHEMA ERROR] Erro ao sincronizar esquema SQLite:", err.message);
        } else {
          console.log("[SQLITE] Tabelas, triggers, chaves e relacionamentos estruturados com sucesso no arquivo local!");
        }
      });
    } catch (e) {
      console.error("[SQLITE SCHEMA ERROR] Erro ao ler esquema SQLite:", e.message);
    }
  }
}

// Automatically initialize PostgreSQL database schema if active

// Automatically initialize PostgreSQL database schema if active
if (usePostgres && pgPool) {
  const schemaFile = path.join(__dirname, 'supabase_schema.sql');
  if (fs.existsSync(schemaFile)) {
    try {
      const ddl = fs.readFileSync(schemaFile, 'utf8');
      pgPool.query(ddl)
        .then(() => {
          console.log("[POSTGRESQL] Tabelas, indices, triggers e administrador inicial sincronizados com sucesso!");
        })
        .catch(err => {
          console.error("[POSTGRESQL SCHEMA ERROR] Erro ao sincronizar esquema inicial:", err.message);
          console.error("[POSTGRESQL SCHEMA DETAIL] Detalhes do erro:", err.detail || "Sem detalhes adicionais");
          console.error("[POSTGRESQL SCHEMA CODE] Código do erro:", err.code);
          
          if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.message.includes('connect')) {
            console.warn("\n⚠️ [FALLBACK SEGURO ACTIVADO] Conexão com o PostgreSQL recusada ou inválida.");
            console.warn("👉 O CondoSphere mudou dinamicamente para o Banco Documental Local em arquivo JSON ('data/db.json')!");
            console.warn("👉 O sistema continuará operando 100% offline com alta performance!\n");
            usePostgres = false;
          }
        });
    } catch (e) {
      console.error("[POSTGRESQL SCHEMA ERROR] Erro ao ler arquivo de esquema:", e.message);
    }
  }
}

// Fallback JSON DB local write helper
function readJsonDB() {
  if (!fs.existsSync(JSON_DB_FILE)) {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(DEFAULT_JSON_DB, null, 2), 'utf8');
  }
  try {
    return JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf8'));
  } catch (e) {
    return DEFAULT_JSON_DB;
  }
}

function writeJsonDB(data) {
  try {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// SAFE SEQUENTIAL JSON WRITE QUEUE TO PREVENT RACE CONDITIONS DURING BULK IMPORTS (No lost data on Ctrl+F5!)
let isWritingJson = false;
const jsonWriteQueue = [];

function processJsonQueue() {
  if (isWritingJson || jsonWriteQueue.length === 0) return;
  isWritingJson = true;
  const task = jsonWriteQueue.shift();
  
  task()
    .then(() => {
      isWritingJson = false;
      processJsonQueue();
    })
    .catch(err => {
      console.error("[JSON WRITE QUEUE ERROR]:", err.message);
      isWritingJson = false;
      processJsonQueue();
    });
}

function safeUpdateJsonDB(table, action, payload, targetId, conflictCol, id, callback) {
  const task = () => {
    return new Promise((resolve) => {
      try {
        const db = readJsonDB();
        if (!db[table]) db[table] = [];

        if (action === 'insert') {
          const items = Array.isArray(payload) ? payload : [payload];
          const inserted = [];
          items.forEach(item => {
            if (!item.id) item.id = 'loc-' + Math.floor(Math.random() * 10000000);
            item.created_at = new Date().toISOString();
            db[table].push(item);
            inserted.push(item);
          });
          writeJsonDB(db);
          callback(null, inserted);
        } else if (action === 'update') {
          if (targetId) {
            const idx = db[table].findIndex(item => String(item.id) === String(targetId));
            if (idx !== -1) {
              db[table][idx] = { ...db[table][idx], ...payload, updated_at: new Date().toISOString() };
            } else {
              db[table].push({ id: targetId, ...payload, created_at: new Date().toISOString() });
            }
          } else {
            // General upsert logic
            let idx = -1;
            if (conflictCol === 'identifier' && payload.identifier) {
              idx = db[table].findIndex(item => item.identifier === payload.identifier);
            } else if (conflictCol === 'cpf' && payload.cpf) {
              idx = db[table].findIndex(item => item.cpf === payload.cpf);
            } else if (conflictCol === 'plate' && payload.plate) {
              idx = db[table].findIndex(item => item.plate === payload.plate);
            } else if (conflictCol === 'id' && payload.id) {
              idx = db[table].findIndex(item => item.id === payload.id);
            }

            if (idx !== -1) {
              db[table][idx] = { ...db[table][idx], ...payload, updated_at: new Date().toISOString() };
            } else {
              db[table].push({ id: 'loc-' + Math.floor(Math.random()*10000000), ...payload, created_at: new Date().toISOString() });
            }
          }
          writeJsonDB(db);
          callback(null, { success: true });
        } else if (action === 'delete') {
          if (db[table]) {
            db[table] = db[table].filter(item => String(item.id) !== String(targetId));
            writeJsonDB(db);
          }
          callback(null, { success: true });
        }
        resolve();
      } catch (e) {
        callback(e);
        resolve(); // resolve anyway to unblock queue
      }
    });
  };
  
  jsonWriteQueue.push(task);
  processJsonQueue();
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers to allow direct client-server connections over Internet (NAT)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ==========================================
  // DUAL-DATABASE RELATIONAL REST API ENDPOINTS
  // ==========================================
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const parts = pathname.split('/').filter(p => p);
    const table = parts[1]; // e.g. 'users', 'residents'
    const id = parts[2];    // e.g. row UUID if deleting/updating

    // --- CASE A: PostgreSQL Engine (Active) ---
    if (usePostgres && pgPool) {
      try {
        // GET /api/:table
        if (req.method === 'GET' && table) {
          const sql = `SELECT * FROM public.${table}`;
          const { rows } = await pgPool.query(sql);
          res.end(JSON.stringify(rows));
          return;
        }

        // DELETE /api/reset (TRUNCATE all tables)
        if (req.method === 'POST' && table === 'reset') {
          const tablesList = ["portaria_logs", "reservations", "common_areas", "vehicles", "receivables", "payables", "residents", "residences", "employees", "providers", "assemblies", "company_settings", "users", "profiles"];
          for (const tbl of tablesList) {
            await pgPool.query(`TRUNCATE TABLE public.${tbl} CASCADE`);
          }
          // Re-insert admin and default profiles
          const schemaFile = path.join(__dirname, 'supabase_schema.sql');
          if (fs.existsSync(schemaFile)) {
            const ddl = fs.readFileSync(schemaFile, 'utf8');
            await pgPool.query(ddl);
          }
          res.end(JSON.stringify({ success: true, message: "Banco de dados PostgreSQL limpo!" }));
          return;
        }

        // POST /api/:table (Insert)
        if (req.method === 'POST' && table) {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              const items = Array.isArray(payload) ? payload : [payload];
              const inserted = [];

              for (const item of items) {
                // Remove unused id or properties if we want postgres to auto-generate UUIDs
                if (!item.id || String(item.id).startsWith('loc-')) {
                  delete item.id;
                }
                const keys = Object.keys(item);
                const values = Object.values(item);
                const params = keys.map((_, i) => `$${i + 1}`).join(', ');
                const columns = keys.join(', ');
                
                const sql = `INSERT INTO public.${table} (${columns}) VALUES (${params}) RETURNING *`;
                const { rows } = await pgPool.query(sql, values);
                inserted.push(rows[0]);
              }
              res.end(JSON.stringify(inserted));
            } catch (err) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // PUT /api/:table (Update / Upsert)
        if (req.method === 'PUT' && table) {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              
              // Handle update by UUID or general upsert
              const targetId = payload.id || id;
              if (targetId && !String(targetId).startsWith('loc-')) {
                delete payload.id;
                const keys = Object.keys(payload);
                const values = Object.values(payload);
                const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
                
                const sql = `UPDATE public.${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
                const { rows } = await pgPool.query(sql, [...values, targetId]);
                res.end(JSON.stringify(rows[0] || { success: true }));
              } else {
                // general upsert fallback
                if (table === 'residences' && payload.identifier) {
                  const keys = Object.keys(payload);
                  const values = Object.values(payload);
                  const params = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  const sql = `INSERT INTO public.residences (${keys.join(', ')}) VALUES (${params}) ON CONFLICT (identifier) DO UPDATE SET ${setClause} RETURNING *`;
                  const { rows } = await pgPool.query(sql, values);
                  res.end(JSON.stringify(rows[0]));
                } else if (table === 'residents' && payload.cpf) {
                  const keys = Object.keys(payload);
                  const values = Object.values(payload);
                  const params = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  const sql = `INSERT INTO public.residents (${keys.join(', ')}) VALUES (${params}) ON CONFLICT (cpf) DO UPDATE SET ${setClause} RETURNING *`;
                  const { rows } = await pgPool.query(sql, values);
                  res.end(JSON.stringify(rows[0]));
                } else if (table === 'vehicles' && payload.plate) {
                  const keys = Object.keys(payload);
                  const values = Object.values(payload);
                  const params = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  const sql = `INSERT INTO public.vehicles (${keys.join(', ')}) VALUES (${params}) ON CONFLICT (plate) DO UPDATE SET ${setClause} RETURNING *`;
                  const { rows } = await pgPool.query(sql, values);
                  res.end(JSON.stringify(rows[0]));
                } else if (table === 'company_settings') {
                  const keys = Object.keys(payload);
                  const values = Object.values(payload);
                  const params = keys.map((_, i) => `$${i + 1}`).join(', ');
                  const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  const sql = `INSERT INTO public.company_settings (${keys.join(', ')}) VALUES (${params}) ON CONFLICT (id) DO UPDATE SET ${setClause} RETURNING *`;
                  const { rows } = await pgPool.query(sql, values);
                  res.end(JSON.stringify(rows[0]));
                } else {
                  res.end(JSON.stringify({ success: true }));
                }
              }
            } catch (err) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // DELETE /api/:table/:id
        if (req.method === 'DELETE' && table && id) {
          const sql = `DELETE FROM public.${table} WHERE id = $1`;
          await pgPool.query(sql, [id]);
          res.end(JSON.stringify({ success: true }));
          return;
        }

      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "[POSTGRESQL ERROR]: " + err.message }));
        return;
      }
    }

    // --- CASE A.2: SQLite Engine (Active) ---
    if (useSQLite && dbSQLite) {
      try {
        // GET /api/:table
        if (req.method === 'GET' && table) {
          const sql = `SELECT * FROM ${table}`;
          dbSQLite.all(sql, [], (err, rows) => {
            if (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: err.message }));
            } else {
              res.end(JSON.stringify(rows || []));
            }
          });
          return;
        }

        // DELETE /api/reset (TRUNCATE all tables)
        if (req.method === 'POST' && table === 'reset') {
          dbSQLite.serialize(() => {
            dbSQLite.run("PRAGMA foreign_keys = OFF;");
            const tablesList = ["portaria_logs", "reservations", "common_areas", "vehicles", "receivables", "payables", "residents", "residences", "employees", "providers", "assemblies", "company_settings", "users", "profiles"];
            for (const tbl of tablesList) {
              dbSQLite.run(`DELETE FROM ${tbl}`);
            }
            dbSQLite.run("PRAGMA foreign_keys = ON;");
            
            // Re-run schema to seed default admin
            const schemaFile = path.join(__dirname, 'sqlite_schema.sql');
            if (fs.existsSync(schemaFile)) {
              const ddl = fs.readFileSync(schemaFile, 'utf8');
              dbSQLite.exec(ddl, (err) => {
                if (err) {
                  res.writeHead(500);
                  res.end(JSON.stringify({ error: "Erro ao resetar: " + err.message }));
                } else {
                  res.end(JSON.stringify({ success: true, message: "Banco de dados SQLite resetado!" }));
                }
              });
            } else {
              res.end(JSON.stringify({ success: true, message: "Banco de dados SQLite limpo!" }));
            }
          });
          return;
        }

        // POST /api/:table (Insert)
        if (req.method === 'POST' && table) {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const items = Array.isArray(payload) ? payload : [payload];
              
              dbSQLite.serialize(() => {
                const inserted = [];
                let pending = items.length;

                if (pending === 0) {
                  res.end(JSON.stringify([]));
                  return;
                }

                items.forEach(item => {
                  if (!item.id || String(item.id).startsWith('loc-')) {
                    const crypto = require('crypto');
                    item.id = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
                  }
                  
                  const keys = Object.keys(item);
                  const values = Object.values(item).map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
                  const placeholders = keys.map(() => '?').join(', ');
                  
                  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
                  dbSQLite.run(sql, values, function(err) {
                    if (err) {
                      if (!res.writableEnded) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: err.message }));
                      }
                      return;
                    }
                    inserted.push(item);
                    pending--;
                    if (pending === 0 && !res.writableEnded) {
                      res.end(JSON.stringify(inserted));
                    }
                  });
                });
              });
            } catch (err) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // PUT /api/:table (Update / Upsert)
        if (req.method === 'PUT' && table) {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const targetId = payload.id || id;
              
              if (targetId && !String(targetId).startsWith('loc-')) {
                delete payload.id;
                const keys = Object.keys(payload);
                const values = Object.values(payload).map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
                const setClause = keys.map(key => `${key} = ?`).join(', ');
                
                const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
                dbSQLite.run(sql, [...values, targetId], function(err) {
                  if (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: err.message }));
                  } else {
                    res.end(JSON.stringify({ success: true, updated: this.changes }));
                  }
                });
              } else {
                // Upsert logic for SQLite
                const keys = Object.keys(payload);
                const values = Object.values(payload).map(v => (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v);
                const placeholders = keys.map(() => '?').join(', ');
                
                let conflictCol = 'id';
                if (table === 'residences') conflictCol = 'identifier';
                else if (table === 'residents') conflictCol = 'cpf';
                else if (table === 'vehicles') conflictCol = 'plate';
                else if (table === 'company_settings') conflictCol = 'id';

                const setClause = keys.map(k => `${k} = excluded.${k}`).join(', ');
                const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(${conflictCol}) DO UPDATE SET ${setClause}`;
                
                dbSQLite.run(sql, values, function(err) {
                  if (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: err.message }));
                  } else {
                    res.end(JSON.stringify({ success: true }));
                  }
                });
              }
            } catch (err) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // DELETE /api/:table/:id
        if (req.method === 'DELETE' && table && id) {
          const sql = `DELETE FROM ${table} WHERE id = ?`;
          dbSQLite.run(sql, [id], function(err) {
            if (err) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: err.message }));
            } else {
              res.end(JSON.stringify({ success: true, deleted: this.changes }));
            }
          });
          return;
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "[SQLITE ENGINE ERROR]: " + err.message }));
        return;
      }
    }

    // --- CASE B: Fallback Lightweight JSON Document Database ---
    const db = readJsonDB();

    // GET /api/:table
    if (req.method === 'GET' && table) {
      res.end(JSON.stringify(db[table] || []));
      return;
    }

    // POST /api/:table
    if (req.method === 'POST' && table) {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          safeUpdateJsonDB(table, 'insert', payload, null, null, null, (err, inserted) => {
            if (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: err.message }));
            } else {
              res.end(JSON.stringify(inserted));
            }
          });
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    // PUT /api/:table
    if (req.method === 'PUT' && table) {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const targetId = payload.id || id;
          
          let conflictCol = 'id';
          if (table === 'residences') conflictCol = 'identifier';
          else if (table === 'residents') conflictCol = 'cpf';
          else if (table === 'vehicles') conflictCol = 'plate';
          else if (table === 'company_settings') conflictCol = 'id';

          safeUpdateJsonDB(table, 'update', payload, targetId, conflictCol, id, (err, result) => {
            if (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: err.message }));
            } else {
              res.end(JSON.stringify(result));
            }
          });
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    // DELETE /api/:table/:id
    if (req.method === 'DELETE' && table && id) {
      safeUpdateJsonDB(table, 'delete', null, id, null, null, (err, result) => {
        if (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.end(JSON.stringify(result));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  // ==========================================
  // STATIC FILE SERVER
  // ==========================================
  let decodedUrl = decodeURIComponent(req.url);
  const qIdx = decodedUrl.indexOf('?');
  if (qIdx !== -1) {
    decodedUrl = decodedUrl.substring(0, qIdx);
  }

  let filePath = path.join(__dirname, decodedUrl);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>Erro 404: Arquivo não encontrado</h1><p>O CondoSphere não localizou o arquivo solicitado solicitado.</p>`, 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>Erro Interno 500</h1><p>${error.code}</p>`, 'utf-8');
      }
    } else {
      const cacheHeaders = extname === '.html' || extname === '.htm'
        ? { 'Content-Type': contentType, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
        : { 'Content-Type': contentType };
      res.writeHead(200, cacheHeaders);
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================================`);
  console.log(`🚀 CONDOSPHERE - SERVIDOR LOCAL & BANCO DE DADOS ATIVO`);
  console.log(`🏠 Acesse no seu navegador local: http://localhost:${PORT}`);
  if (usePostgres) {
    console.log(`💾 BANCO DE DADOS PRINCIPAL: PostgreSQL`);
  } else if (useSQLite) {
    console.log(`💾 BANCO DE DADOS PRINCIPAL: SQLite Relacional`);
  } else {
    console.log(`💾 BANCO DE DADOS PRINCIPAL: JSON Document Database (data/db.json)`);
  }
  console.log(`=======================================================================`);
});
