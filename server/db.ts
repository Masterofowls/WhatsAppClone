import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Required for Neon serverless to work with WebSockets in environments like Replit
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a drizzle instance
export const db = drizzle(pool, { schema });