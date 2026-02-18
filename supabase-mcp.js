#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Load from environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const server = new Server(
  {
    name: "supabase-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

// Example tool: Query table
server.tool(
  "query_table",
  {
    table: "string",
    limit: "number"
  },
  async ({ table, limit }) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(limit || 10)

    if (error) {
      return { content: [{ type: "text", text: error.message }] }
    }

    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) }
      ]
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)

